/*
 * LibreTranslate companion manager.
 *
 * Goal: starting the backend also brings up the translation service automatically,
 * so there is nothing to run by hand on every restart (Mac-safe port 5050).
 *
 * Behaviour:
 *   - Pings LIBRETRANSLATE_URL; if already up, leaves it alone.
 *   - Otherwise spawns it: prefers `docker run` (fixed container name, --rm),
 *     falls back to a local `libretranslate` binary if Docker isn't available.
 *   - Polls readiness (best-effort, non-fatal on timeout — TTS falls back to
 *     MyMemory/English if the service isn't ready yet).
 *   - stopCompanion() cleans up the spawned process / container on backend exit.
 */
const { spawn } = require('child_process');

const PORT = process.env.LIBRETRANSLATE_PORT || 5050;
const URL = process.env.LIBRETRANSLATE_URL || `http://localhost:${PORT}`;
const CONTAINER = 'promogames-libretranslate';
const IMAGE = process.env.LIBRETRANSLATE_IMAGE || 'libretranslate/libretranslate';
const READY_TIMEOUT_MS = 120000;

let child = null;
let dockerMode = false;

async function ping() {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${URL}/languages`, { signal: controller.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

function hasDocker() {
  try {
    // `docker info` exits non-zero if the daemon isn't running.
    const r = spawnSyncSafe('docker', ['info']);
    return r;
  } catch {
    return false;
  }
}

function spawnSyncSafe(cmd, args) {
  try {
    const { spawnSync } = require('child_process');
    const res = spawnSync(cmd, args, { windowsHide: true });
    return !res.error && res.status === 0;
  } catch {
    return false;
  }
}

function startViaDocker() {
  child = spawn('docker', ['run', '--rm', '--name', CONTAINER, '-p', `${PORT}:5000`, IMAGE],
    { stdio: 'ignore', detached: false });
  dockerMode = true;
  child.on('error', () => { /* logged by caller */ });
}

function startViaBinary() {
  child = spawn('libretranslate', ['--port', String(PORT), '--host', '0.0.0.0'],
    { stdio: 'ignore', detached: false });
  dockerMode = false;
  child.on('error', () => { /* logged by caller */ });
}

async function pollReady() {
  const start = Date.now();
  while (Date.now() - start < READY_TIMEOUT_MS) {
    if (await ping()) return true;
    await new Promise(r => setTimeout(r, 1500));
  }
  return false;
}

async function startCompanion() {
  if (await ping()) {
    console.log(`✅ LibreTranslate already running at ${URL}`);
    return;
  }
  console.log(`🔄 LibreTranslate not reachable at ${URL} — starting companion...`);
  try {
    if (hasDocker()) {
      startViaDocker();
    } else {
      startViaBinary();
    }
  } catch (e) {
    console.warn(`⚠️ Could not spawn LibreTranslate (${e.message}). TTS will fall back to MyMemory/English.`);
    return;
  }

  const ready = await pollReady();
  if (ready) {
    console.log(`✅ LibreTranslate companion ready at ${URL}`);
  } else {
    console.warn(`⚠️ LibreTranslate did not become ready in time. TTS will fall back to MyMemory/English until it is up.`);
  }
}

function stopCompanion() {
  try {
    if (dockerMode && child) {
      spawn('docker', ['stop', CONTAINER], { stdio: 'ignore' });
    } else if (child && !child.killed) {
      child.kill('SIGTERM');
    }
  } catch { /* ignore */ }
}

module.exports = { startCompanion, stopCompanion, ping };
