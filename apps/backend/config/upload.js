const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const imagesDir = path.join(__dirname, '../uploads/images');
const soundsDir = path.join(__dirname, '../uploads/sounds');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
if (!fs.existsSync(soundsDir)) fs.mkdirSync(soundsDir, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, imagesDir);
    else if (file.mimetype.startsWith('video/')) cb(null, imagesDir);
    else if (file.mimetype.startsWith('audio/')) cb(null, soundsDir);
    else cb(new Error('Unsupported file category'), false);
  },
  filename: (req, file, cb) => {
    // UUID + validated extension only — never trust original filename
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    const safeExt = ['.jpg','.jpeg','.png','.gif','.webp','.mp4','.webm','.mov','.wav','.mp3','.m4a','.ogg'].includes(ext) ? ext : '';
    cb(null, `${uuidv4()}${safeExt}`);
  },
});

// ── Upload-time image conversion ────────────────────────────────────────────
// Every png/jpg upload is converted to a single WebP (≤1600px; lossless when
// the source has an alpha channel, otherwise q80) and the original is deleted
// before the upload responds. The returned filename/URL then points at the
// final .webp, so stored URLs reference the optimized file directly.
// On any failure the original is kept and stored as-is — uploads never break.
async function convertToWebP(absPath) {
  let tmpPath = null;
  try {
    const sharp = require('sharp');
    const webpPath = absPath.replace(/\.(png|jpe?g)$/i, '.webp');
    if (webpPath === absPath || !fs.existsSync(absPath)) return null;
    const meta = await sharp(absPath).metadata();
    const opts = meta.hasAlpha ? { lossless: true } : { quality: 80 };
    tmpPath = webpPath + '.tmp';
    await sharp(absPath)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp(opts)
      .toFile(tmpPath);
    fs.renameSync(tmpPath, webpPath);
    tmpPath = null;
    fs.unlinkSync(absPath);
    return webpPath;
  } catch (err) {
    if (tmpPath && fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
    console.error('⚠️  Image conversion failed, keeping original:', err.message);
    return null;
  }
}

// Wrap diskStorage so conversion runs (and completes) right after each saved
// png/jpg, before the upload responds.
const storage = {
  _handleFile(req, file, cb) {
    diskStorage._handleFile(req, file, async (err, info) => {
      if (err) return cb(err);
      try {
        if (/^image\/(png|jpe?g)$/.test(file.mimetype) && info.path) {
          const webpPath = await convertToWebP(info.path);
          if (webpPath) {
            info.filename = path.basename(webpPath);
            info.path = webpPath;
            info.size = fs.statSync(webpPath).size;
          }
        }
      } catch {}
      cb(null, info);
    });
  },
  _removeFile(req, file, cb) {
    diskStorage._removeFile(req, file, cb);
  },
};

// MIME + extension must agree and both be on the allowlist. octet-stream is
// explicitly rejected so mislabeled executables can't be stored as "video".
const MIME_EXT = {
  'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/gif': ['.gif'],
  'image/webp': ['.webp'], 'video/mp4': ['.mp4'], 'video/webm': ['.webm'],
  'video/quicktime': ['.mov'], 'audio/mpeg': ['.mp3'], 'audio/mp3': ['.mp3'],
  'audio/wav': ['.wav'], 'audio/x-wav': ['.wav'], 'audio/wave': ['.wav'],
  'audio/ogg': ['.ogg'], 'audio/x-m4a': ['.m4a'], 'audio/mp4': ['.m4a'],
};
const fileFilter = (req, file, cb) => {
  const ext = (path.extname(file.originalname) || '').toLowerCase();
  const allowed = MIME_EXT[file.mimetype];
  if (allowed && allowed.includes(ext)) cb(null, true);
  else cb(new Error(`File type not allowed: ${file.mimetype || 'unknown'}`), false);
};

// Upload size ceiling — videos are the big ones. Override via MAX_UPLOAD_MB.
const MAX_UPLOAD_BYTES = (parseInt(process.env.MAX_UPLOAD_MB, 10) || 100) * 1024 * 1024;

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_UPLOAD_BYTES } });
module.exports = upload;
