import { useEffect, useRef } from 'react'
import TYPER_WORDS from '../../apps/frontend/src/typerWords'

export default function TyperPlayerPage({ gameData, sessionToken, onComplete }) {
  const containerRef = useRef(null)
  const sessionTokenRef = useRef(sessionToken)
  const onCompleteRef = useRef(onComplete)
  const gameDataRef = useRef(gameData)
  const endNotifiedRef = useRef(false)

  useEffect(() => { sessionTokenRef.current = sessionToken }, [sessionToken])
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])
  useEffect(() => { gameDataRef.current = gameData }, [gameData])

  useEffect(() => {
    if (!containerRef.current) return

    var WORDS = TYPER_WORDS;

    var EXTRA_WORD_TIME = 1500;
    var WORD_TIME = {
      easy:   function(len){ return 1500 + EXTRA_WORD_TIME + len*220; },
      medium: function(len){ return 1100 + EXTRA_WORD_TIME + len*190; },
      hard:   function(len){ return 850  + EXTRA_WORD_TIME + len*160; }
    }
    function wordBudget(len){ return WORD_TIME[difficulty](len) * speedScale; }

    var ICON_SOUND_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9v6h4l5 5V4L8 9H4Z"/><path d="M17.5 8.5a5 5 0 0 1 0 7"/><path d="M20 6a8.5 8.5 0 0 1 0 12"/></svg>';
    var ICON_SOUND_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9v6h4l5 5V4L8 9H4Z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';

    var root = containerRef.current;
    var startWrap = root.querySelector('#start-wrap');
    var gameWrap = root.querySelector('#game-wrap');
    var endWrap = root.querySelector('#end-wrap');
    var diffRow = root.querySelector('#difficulty-row');
    var durRow = root.querySelector('#duration-row');
    var startBtn = root.querySelector('#start-btn');
    var quitBtn = root.querySelector('#quit-btn');
    var retryBtn = root.querySelector('#retry-btn');
    var settingsBtn = root.querySelector('#settings-btn');
    var soundToggle = root.querySelector('#sound-toggle');
    var hiddenInput = root.querySelector('#hidden-input');
    var tapVeil = root.querySelector('#tap-veil');
    var ringProgress = root.querySelector('#ring-progress');
    var ladderTrack = root.querySelector('#ladder-track');
    var lettersBadge = root.querySelector('#letters-badge');
    var currentWordEl = null;
    var flashEl = root.querySelector('#flash');
    var impactRingEl = root.querySelector('#impact-ring');
    var bellIndicatorEl = root.querySelector('#bell-indicator');
    var paperCardEl = root.querySelector('.paper-card');
    var mistakesHint = root.querySelector('#mistakes-hint');

    var statTime = root.querySelector('#stat-time');
    var statWpm = root.querySelector('#stat-wpm');
    var statAcc = root.querySelector('#stat-acc');
    var statStreak = root.querySelector('#stat-streak');

    var resWpm = root.querySelector('#res-wpm');
    var resAcc = root.querySelector('#res-acc');
    var resStreak = root.querySelector('#res-streak');
    var resWords = root.querySelector('#res-words');
    var resMistakes = root.querySelector('#res-mistakes');
    var resScore = root.querySelector('#res-score');

    soundToggle.innerHTML = ICON_SOUND_ON;

    requestAnimationFrame(function(){
      root.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
    });
    updateShell();

    var gSettings = (gameDataRef.current && gameDataRef.current.settings) || {};
    var gSoundMap = (gameDataRef.current && gameDataRef.current.soundMap) || {};
    if (typeof gSoundMap !== 'object' || gSoundMap === null) gSoundMap = {};

    var customWords = (gameDataRef.current && Array.isArray(gameDataRef.current.words))
      ? gameDataRef.current.words
          .map(function(w){ return { text: (w.word_text || '').toUpperCase(), diff: (w.difficulty || 'medium') }; })
          .filter(function(w){ return w.text.length > 0; })
      : [];

    var sFallSpeed = Number(gSettings.fall_speed) || 2;
    var speedScale = 2 / sFallSpeed;
    var maxSim = gSettings.max_simultaneous ? Number(gSettings.max_simultaneous) : 2;
    var maxMisses = gSettings.max_misses ? Number(gSettings.max_misses) : 0;
    var targetWords = gSettings.target_words ? Number(gSettings.target_words) : 0;

    var diffMode = gSettings.difficulty_mode;
    var initialDifficulty = (diffMode === 'easy' || diffMode === 'medium' || diffMode === 'hard') ? diffMode : 'medium';
    var initialDuration = gSettings.time_limit_seconds ? Number(gSettings.time_limit_seconds) : 60;

    var difficulty = initialDifficulty;
    var duration = initialDuration;
    var soundOn = true;

    function playSoundById(id){
      if (!soundOn || !id) return;
      var url = gSoundMap[id];
      if (!url) return;
      try {
        var a = new window.Audio(url);
        a.play().catch(function(){});
      } catch(e){}
    }

    var durMatch = durRow.querySelector('.key[data-dur="' + duration + '"]');
    if (durMatch) {
      durRow.querySelectorAll('.key').forEach(function(b){ b.classList.remove('active'); });
      durMatch.classList.add('active');
    }
    var diffMatch = diffRow.querySelector('.key[data-diff="' + difficulty + '"]');
    if (diffMatch) {
      diffRow.querySelectorAll('.key').forEach(function(b){ b.classList.remove('active'); });
      diffMatch.classList.add('active');
    }

    var audioCtx = null;
    var masterBus = null;
    function getCtx(){
      if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      return audioCtx;
    }
    function getMaster(){
      var ctx = getCtx();
      if(!masterBus){
        var comp = ctx.createDynamicsCompressor();
        comp.threshold.setValueAtTime(-16, ctx.currentTime);
        comp.knee.setValueAtTime(18, ctx.currentTime);
        comp.ratio.setValueAtTime(5, ctx.currentTime);
        comp.attack.setValueAtTime(0.002, ctx.currentTime);
        comp.release.setValueAtTime(0.13, ctx.currentTime);
        comp.connect(ctx.destination);
        var makeup = ctx.createGain();
        makeup.gain.value = 1.6;
        makeup.connect(comp);
        masterBus = makeup;
      }
      return masterBus;
    }

    function clack(strength){
      if(!soundOn) return;
      try{
        var ctx = getCtx();
        var out = getMaster();
        var t = ctx.currentTime;
        var s = strength || 1;

        var bufSize = Math.floor(ctx.sampleRate * 0.025);
        var buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for(var i = 0; i < bufSize; i++){
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.6);
        }
        var noise = ctx.createBufferSource();
        noise.buffer = buffer;
        var nf = ctx.createBiquadFilter();
        nf.type = 'bandpass';
        nf.frequency.value = 3000;
        nf.Q.value = 0.65;
        var ng = ctx.createGain();
        ng.gain.setValueAtTime(0.5 * s, t);
        ng.gain.exponentialRampToValueAtTime(0.0006, t + 0.025);
        noise.connect(nf).connect(ng).connect(out);
        noise.start(t);
        noise.stop(t + 0.025);

        var osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150 + Math.random() * 30, t);
        osc.frequency.exponentialRampToValueAtTime(65, t + 0.05);
        var oGain = ctx.createGain();
        oGain.gain.setValueAtTime(0.22 * s, t);
        oGain.gain.exponentialRampToValueAtTime(0.0006, t + 0.06);
        osc.connect(oGain).connect(out);
        osc.start(t);
        osc.stop(t + 0.06);

        var osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = 1900 + Math.random() * 500;
        var g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.09 * s, t);
        g2.gain.exponentialRampToValueAtTime(0.0005, t + 0.014);
        osc2.connect(g2).connect(out);
        osc2.start(t);
        osc2.stop(t + 0.014);
      }catch(e){}
    }

    function errBuzz(){
      if(!soundOn) return;
      if(playSoundById(gSettings.sound_wrong_id)) return;
      try{
        var ctx = getCtx();
        var out = getMaster();
        var t = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(190, t);
        osc.frequency.exponentialRampToValueAtTime(85, t + 0.2);
        gain.gain.setValueAtTime(0.13, t);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.22);
        osc.connect(gain).connect(out);
        osc.start(t);
        osc.stop(t + 0.22);
      }catch(e){}
    }

    function ding(){
      if(!soundOn) return;
      if(playSoundById(gSettings.sound_correct_id)) return;
      try{
        var ctx = getCtx();
        var out = getMaster();
        var t = ctx.currentTime;

        var bufSize = Math.floor(ctx.sampleRate * 0.012);
        var buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for(var i = 0; i < bufSize; i++){
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
        }
        var noise = ctx.createBufferSource();
        noise.buffer = buffer;
        var nf = ctx.createBiquadFilter();
        nf.type = 'highpass';
        nf.frequency.value = 3000;
        var ng = ctx.createGain();
        ng.gain.setValueAtTime(0.3, t);
        ng.gain.exponentialRampToValueAtTime(0.0005, t + 0.03);
        noise.connect(nf).connect(ng).connect(out);
        noise.start(t);
        noise.stop(t + 0.03);

        var sub = ctx.createOscillator();
        var subGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(220, t);
        sub.frequency.exponentialRampToValueAtTime(85, t + 0.09);
        subGain.gain.setValueAtTime(0.32, t);
        subGain.gain.exponentialRampToValueAtTime(0.0006, t + 0.1);
        sub.connect(subGain).connect(out);
        sub.start(t);
        sub.stop(t + 0.1);

        var notes = [1046.5, 1318.5, 1568, 2093];
        notes.forEach(function(freq, idx){
          var start = t + idx * 0.032;
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq * 0.9, start);
          osc.frequency.exponentialRampToValueAtTime(freq, start + 0.018);
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.linearRampToValueAtTime(0.32, start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0004, start + 0.2);
          osc.connect(gain).connect(out);
          osc.start(start);
          osc.stop(start + 0.2);
        });
      }catch(e){}
    }

    function countdownTick(){
      if(!soundOn) return;
      try{
        var ctx = getCtx();
        var out = getMaster();
        var t = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.14);
        osc.connect(gain).connect(out);
        osc.start(t);
        osc.stop(t + 0.14);
      }catch(e){}
    }

    function countdownGo(){
      if(!soundOn) return;
      try{
        var ctx = getCtx();
        var out = getMaster();
        var t = ctx.currentTime;
        [1046.5, 1318.5, 1568, 2093].forEach(function(freq, i){
          var start = t + i * 0.045;
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.linearRampToValueAtTime(0.2, start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.32);
          osc.connect(gain).connect(out);
          osc.start(start);
          osc.stop(start + 0.32);
        });
      }catch(e){}
    }

    function stampThud(big){
      if(!soundOn) return;
      try{
        var ctx = getCtx();
        var out = getMaster();
        var t = ctx.currentTime;
        var s = big ? 1 : 0.55;

        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(big ? 95 : 130, t);
        osc.frequency.exponentialRampToValueAtTime(big ? 45 : 60, t + (big ? 0.16 : 0.09));
        g.gain.setValueAtTime(0.0008, t);
        g.gain.linearRampToValueAtTime(0.55 * s, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0007, t + (big ? 0.22 : 0.12));
        osc.connect(g).connect(out);
        osc.start(t);
        osc.stop(t + (big ? 0.24 : 0.14));

        var bufSize = Math.floor(ctx.sampleRate * (big ? 0.05 : 0.03));
        var buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for(var i = 0; i < bufSize; i++){
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.3);
        }
        var noise = ctx.createBufferSource();
        noise.buffer = buffer;
        var nf = ctx.createBiquadFilter();
        nf.type = 'lowpass';
        nf.frequency.value = big ? 1400 : 1800;
        var ng = ctx.createGain();
        ng.gain.setValueAtTime(0.25 * s, t);
        ng.gain.exponentialRampToValueAtTime(0.0006, t + (big ? 0.05 : 0.03));
        noise.connect(nf).connect(ng).connect(out);
        noise.start(t);
        noise.stop(t + (big ? 0.05 : 0.03));

        if(big){
          var osc2 = ctx.createOscillator();
          var g2 = ctx.createGain();
          osc2.type = 'triangle';
          osc2.frequency.value = 2200;
          g2.gain.setValueAtTime(0.0008, t);
          g2.gain.linearRampToValueAtTime(0.09, t + 0.004);
          g2.gain.exponentialRampToValueAtTime(0.0004, t + 0.03);
          osc2.connect(g2).connect(out);
          osc2.start(t);
          osc2.stop(t + 0.03);
        }
      }catch(e){}
    }

    diffRow.addEventListener('click', function(e){
      var btn = e.target.closest('.key');
      if(!btn) return;
      diffRow.querySelectorAll('.key').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      difficulty = btn.dataset.diff;
      clack();
    });
    durRow.addEventListener('click', function(e){
      var btn = e.target.closest('.key');
      if(!btn) return;
      durRow.querySelectorAll('.key').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      duration = parseInt(btn.dataset.dur, 10);
      clack();
    });

    soundToggle.addEventListener('click', function(){
      soundOn = !soundOn;
      soundToggle.innerHTML = soundOn ? ICON_SOUND_ON : ICON_SOUND_OFF;
      if(soundOn) clack();
    });

    var queue = [];
    var history = [];
    var currentWord = '';

    var wordGen = 0;
    var justAdvanced = false;

    var wordAnimFrame = null;
    var wordDeadline = 0;
    var wordActive = false;
    var wordLocked = false;
    var ringStartedAt = 0;
    var lastSubmitAt = 0;
    var roundTimerId = null;
    var roundEnd = 0;
    var startTime = 0;

    var correctChars = 0;
    var wordsCompleted = 0;
    var correctWords = 0;
    var mistakes = 0;
    var streak = 0;
    var bestStreak = 0;
    var score = 0;

    function shuffle(arr){
      var a = arr.slice();
      for(var i=a.length-1;i>0;i--){
        var j = Math.floor(Math.random()*(i+1));
        var t=a[i]; a[i]=a[j]; a[j]=t;
      }
      return a;
    }

    function fillQueue(){
      var cust = customWords.filter(function(w){ return w.diff === difficulty; });
      var bank = cust.length ? cust.map(function(w){ return w.text; }) : WORDS[difficulty];
      var batch = shuffle(bank);
      for(var i=0;i<batch.length;i++) queue.push(batch[i]);
    }

    function nextWord(){
      if(queue.length < 5) fillQueue();
      return queue.shift();
    }

    function escapeHtml(s){
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function charSpansHtml(typed){
      var html = '';
      var caretPlaced = false;
      for(var i=0;i<currentWord.length;i++){
        if(i === typed.length){
          html += '<span class="caret"></span>';
          caretPlaced = true;
        }
        var ch = currentWord[i];
        var cls = 'pending';
        if(i < typed.length){
          cls = (typed[i].toLowerCase() === ch.toLowerCase()) ? 'correct' : 'incorrect';
          if(i === typed.length - 1 && typed[i] === ch) cls += ' stamp';
        }
        html += '<span class="ch ' + cls + '">' + escapeHtml(ch) + '</span>';
      }
      if(!caretPlaced){
        html += '<span class="caret"></span>';
      }
      return html;
    }

    function renderLadder(typed){
      var doneSlice = history.slice(-2);
      while(doneSlice.length < 2) doneSlice.unshift(null);
      var nextSlice = queue.slice(0, Math.max(1, maxSim));
      while(nextSlice.length < 2) nextSlice.push('');

      var html = '';
      doneSlice.forEach(function(item){
        if(!item){ html += '<div class="ladder-row done" style="visibility:hidden;">&nbsp;</div>'; return; }
        var rowCls = 'ladder-row done' + (item.ok ? '' : ' wrong');
        html += '<div class="' + rowCls + '"><span class="w">' + escapeHtml(item.word) + '</span><span class="tick">' + (item.ok ? '✓' : '✕') + '</span></div>';
      });
      html += '<div class="ladder-row current" id="current-word">' + charSpansHtml(typed || '') + '</div>';
      nextSlice.forEach(function(w){
        html += '<div class="ladder-row next">' + escapeHtml(w) + '</div>';
      });

      ladderTrack.innerHTML = html;
      currentWordEl = root.querySelector('#current-word');

      if(lettersBadge){
        var n = currentWord.length;
        lettersBadge.textContent = n + (n === 1 ? ' letter' : ' letters');
      }
    }

    function updateCurrentWordChars(typed){
      if(!currentWordEl) return;
      currentWordEl.innerHTML = charSpansHtml(typed);
    }

    var RING_CIRCUMFERENCE = 917.35;

    function setRing(pct){
      var c = Math.max(0, Math.min(100, pct));
      ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - c / 100);
      ringProgress.classList.toggle('low', c < 25);
    }

    function ringTick(gen){
      if(!wordActive || gen !== wordGen) return;
      var now = performance.now();
      if(now - ringStartedAt < 8) {
        wordAnimFrame = requestAnimationFrame(function(){ ringTick(gen); });
        return;
      }
      var remaining = wordDeadline - now;
      if(remaining <= 0){
        setRing(0);
        wordActive = false;
        submitWord(true, gen);
        return;
      }
      var pct = (remaining / wordBudget(currentWord.length)) * 100;
      setRing(pct);
      wordAnimFrame = requestAnimationFrame(function(){ ringTick(gen); });
    }

    function startRing(){
      wordActive = false;
      cancelAnimationFrame(wordAnimFrame);
      var budget = wordBudget(currentWord.length);
      var now = performance.now();
      ringStartedAt = now;
      wordDeadline = now + budget;
      wordActive = true;
      setRing(100);
      var gen = wordGen;
      wordAnimFrame = requestAnimationFrame(function(){ ringTick(gen); });
    }

    function stopRing(){
      wordActive = false;
      cancelAnimationFrame(wordAnimFrame);
    }

    function retrigger(el, cls){
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    }

    function flash(){ retrigger(flashEl, 'hit'); }
    function pingRing(){ retrigger(impactRingEl, 'ping'); }
    function ringBell(){ retrigger(bellIndicatorEl, 'ring'); }
    function snapCarriage(){ retrigger(paperCardEl, 'return-snap'); }
    function shakePaper(){ retrigger(paperCardEl, 'shake'); }
    function pulseStreak(){ retrigger(statStreak, 'streak-hot'); }

    var MILESTONE_WORDS = {
      5:  ['Nice run!','Warmed up!','Keep going!'],
      10: ['On a roll!','Sharp!','Cruising!'],
      15: ['Blazing!','Locked in!','Unstoppable!'],
      20: ['Incredible!','Machine mode!','On fire!']
    };
    var streakLayer = root.querySelector('#streak-popup-layer');

    function spawnStreakPopup(streak){
      if(streak < 2 || !streakLayer) return;
      var tag = document.createElement('div');
      tag.className = 'streak-popup';
      tag.textContent = '×' + streak;
      tag.style.setProperty('--rot', (Math.random()*14 - 7).toFixed(1) + 'deg');
      tag.style.marginLeft = (Math.random()*16 - 8).toFixed(1) + 'px';
      streakLayer.appendChild(tag);
      setTimeout(function(){ if(tag.parentNode) tag.parentNode.removeChild(tag); }, 900);

      if(streak % 5 === 0){
        var tierKeys = [5,10,15,20];
        var tier = 20;
        for(var i=0;i<tierKeys.length;i++){ if(streak <= tierKeys[i]){ tier = tierKeys[i]; break; } }
        var pool = MILESTONE_WORDS[tier] || MILESTONE_WORDS[20];
        var word = pool[Math.floor(Math.random()*pool.length)];
        var banner = document.createElement('div');
        banner.className = 'streak-popup milestone';
        banner.textContent = '✦ ' + word;
        banner.style.setProperty('--rot', (Math.random()*10 - 5).toFixed(1) + 'deg');
        streakLayer.appendChild(banner);
        setTimeout(function(){ if(banner.parentNode) banner.parentNode.removeChild(banner); }, 1200);
        playSoundById(gSettings.sound_combo_id);
      }
    }

    function loadNextWord(){
      stopRing();
      currentWord = nextWord();
      wordGen++;
      justAdvanced = false;
      hiddenInput.value = '';
      prevValue = '';
      renderLadder('');
      startRing();
    }

    function submitWord(timedOut, forGen){
      if(forGen !== wordGen) return;
      if(wordLocked) return;
      var now = performance.now();
      if(!timedOut && now - lastSubmitAt < 40) return;
      lastSubmitAt = now;
      wordLocked = true;
      stopRing();

      var typed = cleanTyped(hiddenInput.value);
      var ok = (!timedOut) && (typed.toLowerCase() === currentWord.toLowerCase());
      wordsCompleted++;
      history.push({ word: currentWord, ok: ok });
      if(ok){
        correctWords++;
        correctChars += currentWord.length;
        streak++;
        bestStreak = Math.max(bestStreak, streak);
        score += currentWord.length * 10 * (1 + Math.min(streak,10)*0.1);
        ding(); flash(); pingRing(); ringBell(); snapCarriage();
        spawnStreakPopup(streak);
        if(streak > 0 && streak % 5 === 0) pulseStreak();
      } else {
        mistakes++;
        streak = 0;
        errBuzz(); shakePaper();
      }
      updateStatsDisplay();

      if (targetWords > 0 && correctWords >= targetWords) { wordLocked = false; endRound(); return; }
      if (maxMisses > 0 && mistakes >= maxMisses) { wordLocked = false; endRound(); return; }

      wordLocked = false;
      loadNextWord();
    }

    function updateStatsDisplay(){
      var elapsedMin = Math.max((performance.now() - startTime) / 60000, 1/600);
      var wpm = Math.round((correctChars/5) / elapsedMin);
      var acc = wordsCompleted > 0 ? Math.round(correctWords/wordsCompleted*100) : 100;
      statWpm.textContent = wpm;
      statAcc.textContent = acc + '%';
      statStreak.textContent = streak;
      mistakesHint.textContent = mistakes + (mistakes === 1 ? ' mistake' : ' mistakes');
    }

    function tickRoundTimer(){
      var remaining = Math.ceil((roundEnd - performance.now())/1000);
      if(remaining <= 0){
        statTime.textContent = 0;
        endRound();
        return;
      }
      statTime.textContent = remaining;
      statTime.classList.toggle('warn', remaining <= 10);
    }

    var countdownOverlay = root.querySelector('#countdown-overlay');
    var countdownTimeoutId = null;

    function showCountdown(onDone){
      var t0 = performance.now();
      var tickMs = 800;
      var goMs = 550;
      countdownOverlay.classList.remove('hidden');
      tapVeil.classList.add('hidden');
      focusInput();

      function render(){
        var el = performance.now() - t0;
        var label;
        var sound = 'tick';
        if(el < tickMs){ label = '3'; }
        else if(el < tickMs * 2){ label = '2'; }
        else if(el < tickMs * 3){ label = '1'; }
        else if(el < tickMs * 3 + goMs){ label = 'Go!'; }
        else {
          clearInterval(countdownTimeoutId);
          countdownTimeoutId = null;
          countdownOverlay.classList.add('hidden');
          onDone();
          return;
        }
        if(countdownOverlay.textContent !== label){
          countdownOverlay.textContent = label;
          retrigger(countdownOverlay, 'pop');
          if(sound === 'tick') countdownTick();
          else countdownGo();
        }
      }
      clearInterval(countdownTimeoutId);
      countdownTimeoutId = setInterval(render, 70);
      render();
    }

    function startRound(){
      queue = [];
      history = [];
      correctChars = 0; wordsCompleted = 0; correctWords = 0; mistakes = 0;
      streak = 0; bestStreak = 0; score = 0;
      wordGen = 0;
      justAdvanced = false;
      wordLocked = false;
      lastSubmitAt = 0;
      gameActive = true;
      prevValue = '';
      if(streakLayer) streakLayer.innerHTML = '';
      statTime.classList.remove('warn');

      clearTimeout(countdownTimeoutId);
      countdownTimeoutId = null;
      clearInterval(roundTimerId);
      stopRing();

      startWrap.classList.add('hidden');
      endWrap.classList.add('hidden');
      gameWrap.classList.add('active');
      tapVeil.classList.add('hidden');
      updateShell();

      statTime.textContent = duration;
      statWpm.textContent = 0;
      statAcc.textContent = '100%';
      statStreak.textContent = 0;
      mistakesHint.textContent = '0 mistakes';
      ladderTrack.innerHTML = '';
      setRing(100);

      showCountdown(function(){
        startTime = performance.now();
        roundEnd = startTime + duration*1000;
        statTime.textContent = duration;

        clearInterval(roundTimerId);
        roundTimerId = setInterval(tickRoundTimer, 200);

        loadNextWord();
        updateStatsDisplay();
        focusInput();
      });
    }

    function submitSession(wpm, acc, finalScore){
      var token = sessionTokenRef.current;
      if(!token) return;
      fetch('/api/play/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: token,
          score: Math.round(finalScore),
          player_data: {
            wpm: wpm,
            accuracy: acc,
            best_streak: bestStreak,
            words_typed: correctWords,
            mistakes: mistakes,
            difficulty: difficulty,
            duration: duration
          }
        })
      }).catch(function(){});
    }

    function endRound(){
      gameActive = false;
      playSoundById(gSettings.sound_gameover_id);
      clearTimeout(countdownTimeoutId);
      countdownTimeoutId = null;
      countdownOverlay.classList.add('hidden');
      clearInterval(roundTimerId);
      stopRing();
      wordGen++;
      gameWrap.classList.remove('active');
      endWrap.classList.remove('hidden');
      hiddenInput.blur();

      var elapsedMin = Math.max(duration/60, 1/600);
      var wpm = Math.round((correctChars/5) / elapsedMin);
      var acc = wordsCompleted > 0 ? Math.round(correctWords/wordsCompleted*100) : 100;

      resWpm.textContent = wpm;
      resAcc.textContent = acc + '%';
      resStreak.textContent = bestStreak;
      resWords.textContent = correctWords;
      resMistakes.textContent = mistakes;
      resScore.textContent = Math.round(score);

      submitSession(wpm, acc, score);
      stampResults();
      // Notify the host PlayerPage that the game is finished so guests get the
      // "save your progress" login prompt (mentors/completes the thankyou flow).
      if (!endNotifiedRef.current && onCompleteRef.current) {
        endNotifiedRef.current = true;
        setTimeout(function(){ onCompleteRef.current({ complete: true }); }, 800);
      }
    }

    function stampResults(){
      var stampEl = root.querySelector('.end-stamp');
      var panelEl = root.querySelector('.end-wrap.panel');
      var resultEls = root.querySelectorAll('.results-grid .result');

      retrigger(stampEl, 'stamp-in');
      retrigger(panelEl, 'thump');
      stampThud(true);

      resultEls.forEach(function(el){ retrigger(el, 'stamp-in'); });
      [50, 150, 250, 350, 450, 550].forEach(function(delay){
        setTimeout(function(){ stampThud(false); }, delay);
      });
    }

    function focusInput(){
      hiddenInput.focus({preventScroll:true});
    }

    /* ── Named handlers (so we can remove them on cleanup) ──── */
    function onPaperClick(){ focusInput(); }

    function onInputBlur(){
      if(gameWrap.classList.contains('active')){
        tapVeil.classList.remove('hidden');
      }
    }
    function onInputFocus(){ tapVeil.classList.add('hidden'); }

    var composing = false;
    var prevValue = '';
    function onCompositionStart(){ composing = true; }
    function onCompositionEnd(){ composing = false; flushInput(); }
    function cleanTyped(s){ return s.replace(/[\u200B\u200C\u200D\uFEFF\u00AD\u2060]/g, ''); }
    function flushInput(){
      var typed = cleanTyped(hiddenInput.value);
      if(typed === prevValue) return;
      prevValue = typed;
      updateCurrentWordChars(typed);
      if(typed.toLowerCase() === currentWord.toLowerCase()){
        justAdvanced = true;
        submitWord(false, wordGen);
      }
    }
    function onInputInput(){
      flushInput();
    }
    function onInputKeydown(e){
      if(e.key === ' ' || e.key === 'Enter'){
        e.preventDefault();
        if(justAdvanced){
          justAdvanced = false;
          return;
        }
        submitWord(false, wordGen);
      } else if(e.key.length === 1 || e.key === 'Backspace'){
        justAdvanced = false;
        clack(0.75);
      }
    }

    function onStartClick(){ clack(); startRound(); }
    function onRetryClick(){ clack(); startRound(); }
    function onQuitClick(){ clack(); endRound(); }
    function onSettingsClick(){
      clack();
      endWrap.classList.add('hidden');
      startWrap.classList.remove('hidden');
      updateShell();
    }

    function updateShell(){
      root.classList.toggle('tp-landing', !startWrap.classList.contains('hidden'));
      root.classList.toggle('tp-playing', gameWrap.classList.contains('active'));
    }

    /* ── Attach ────────────────────────────────────────────── */
    root.querySelector('.paper-card').addEventListener('click', onPaperClick);
    hiddenInput.addEventListener('blur', onInputBlur);
    hiddenInput.addEventListener('focus', onInputFocus);
    hiddenInput.addEventListener('input', onInputInput);
    hiddenInput.addEventListener('keydown', onInputKeydown);
    hiddenInput.addEventListener('compositionstart', onCompositionStart);
    hiddenInput.addEventListener('compositionend', onCompositionEnd);
    startBtn.addEventListener('click', onStartClick);
    retryBtn.addEventListener('click', onRetryClick);
    quitBtn.addEventListener('click', onQuitClick);
    settingsBtn.addEventListener('click', onSettingsClick);

    /* ── Refresh guard ──────────────────────────────────────── */
    var gameActive = false;
    function onBeforeUnload(e){
      if(gameActive){
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload);

    /* ── Chrome tab-throttle guard ──────────────────────────── */
    var savedDeadline = 0;
    function onVisibilityChange(){
      if(document.hidden){
        if(wordActive){
          savedDeadline = wordDeadline - performance.now();
          stopRing();
        }
      } else {
        if(savedDeadline > 0 && wordActive === false && !wordLocked){
          wordDeadline = performance.now() + savedDeadline;
          wordActive = true;
          var gen = wordGen;
          wordAnimFrame = requestAnimationFrame(function(){ ringTick(gen); });
        }
        savedDeadline = 0;
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    /* ── Detach everything on cleanup ───────────────────────── */
    return function(){
      clearTimeout(countdownTimeoutId);
      countdownTimeoutId = null;
      clearInterval(roundTimerId);
      stopRing();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      root.querySelector('.paper-card').removeEventListener('click', onPaperClick);
      hiddenInput.removeEventListener('blur', onInputBlur);
      hiddenInput.removeEventListener('focus', onInputFocus);
      hiddenInput.removeEventListener('input', onInputInput);
      hiddenInput.removeEventListener('keydown', onInputKeydown);
      hiddenInput.removeEventListener('compositionstart', onCompositionStart);
      hiddenInput.removeEventListener('compositionend', onCompositionEnd);
      window.removeEventListener('beforeunload', onBeforeUnload);
      startBtn.removeEventListener('click', onStartClick);
      retryBtn.removeEventListener('click', onRetryClick);
      quitBtn.removeEventListener('click', onQuitClick);
      settingsBtn.removeEventListener('click', onSettingsClick);
    };
  }, []);

  return (
    <div ref={containerRef} className="tp-root" style={{ color: 'var(--cream)', fontFamily: "'Inter', sans-serif", background: '#1c122f' }}>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

:root{
  --ink-950: #140c23; --ink-900: #1c122f; --ink-800: #271c43; --ink-700: #332757; --ink-600: #41336c;
  --paper-100: #f8f2fc; --paper-200: #ece0f6; --paper-300: #dcc5ee; --paper-line: #b89bd6; --paper-shadow: #9c7ec0;
  --copper-300: #d3b0f7; --copper-400: #b98af0; --copper-500: #9c5fe0; --copper-600: #7c3fc4; --copper-700: #5b2d94;
  --ribbon-400: #e0578a; --ribbon-500: #c23468; --ribbon-600: #9c2452;
  --teal-300: #f0d68f; --teal-400: #e0bb5e; --teal-500: #c89b3a;
  --brass-400: #d8b96a;
  --ink-text: #291c38; --ink-text-soft: #6d5a80;
  --cream: #f3ecfa; --cream-dim: rgba(243,236,250,0.64); --cream-faint: rgba(243,236,250,0.36);
  --r-sm: 8px; --r-md: 14px; --r-lg: 22px;
  --shadow-deep: 0 24px 60px rgba(5,15,14,0.55); --shadow-soft: 0 10px 26px rgba(5,15,14,0.35);
}
*{ box-sizing:border-box; }
.tp-root{ min-height:100vh; min-height:100dvh; display:flex; align-items:center; justify-content:center; padding:28px 18px; position:relative; overflow-x:hidden; }
.tp-root.tp-landing{ height:100vh; height:100dvh; overflow:hidden; padding:20px 18px; overscroll-behavior:none; }
@media (max-height:820px){
  .tp-root.tp-landing{ padding:16px 16px; }
  .tp-root.tp-landing .start-wrap{ gap:16px; }
  .tp-root.tp-landing .brand-mark{ font-size: clamp(30px, 6.2vw, 44px); margin-bottom:12px; }
  .tp-root.tp-landing .sub{ font-size:14px; line-height:1.5; margin-bottom:14px; }
  .tp-root.tp-landing .mini-stats{ gap:16px; }
  .tp-root.tp-landing .ticket{ padding:20px 20px; }
  .tp-root.tp-landing .field{ margin-bottom:12px; }
  .tp-root.tp-landing .field-label{ margin-bottom:8px; }
  .tp-root.tp-landing .key{ padding:8px 18px; font-size:15px; }
  .tp-root.tp-landing .key-space{ padding:11px 20px; margin-top:4px; }
  .tp-root.tp-landing .hint-row{ margin-top:8px; }
}
@media (max-height:640px){
  .tp-root.tp-landing .illustration{ display:none; }
  .tp-root.tp-landing .mini-stats{ display:none; }
  .tp-root.tp-landing .site-tag{ margin-bottom:8px; }
  .tp-root.tp-landing .eyebrow{ margin-bottom:10px; }
}
.tp-root.tp-playing{ height:100vh; height:100dvh; overflow:hidden; padding:12px 14px; overscroll-behavior:none; }
.tp-root.tp-playing .game-wrap{ display:flex; flex-direction:column; height:100%; min-height:0; }
.tp-root.tp-playing .top-row{ margin-bottom:12px; }
.tp-root.tp-playing .console{ margin-top:12px; }
.tp-root.tp-playing .paper-frame{ flex:1; min-height:0; display:flex; flex-direction:column; justify-content:center; margin:0; }
.tp-root.tp-playing .paper-frame .rollers{ margin-bottom:2px; }
.tp-root.tp-playing .ladder-stage{ flex:1; min-height:0; max-height:520px; }
@media (max-height:640px){
  .tp-root.tp-playing .top-row{ margin-bottom:8px; }
  .tp-root.tp-playing .console{ margin-top:8px; }
  .tp-root.tp-playing .game-footer{ margin-top:8px; }
  .tp-root.tp-playing .ladder-row.done{ font-size:16px; }
  .tp-root.tp-playing .ladder-row.next{ font-size:16px; }
}
.stage{ width:100%; max-width: 960px; position:relative; }
.reveal{ opacity:0; transform: translateY(10px); transition: opacity .5s ease, transform .5s ease; }
.reveal.in{ opacity:1; transform:none; }
.reveal:nth-child(1){ transition-delay: .02s; } .reveal:nth-child(2){ transition-delay: .09s; } .reveal:nth-child(3){ transition-delay: .16s; } .reveal:nth-child(4){ transition-delay: .23s; }
.start-wrap{ display:grid; grid-template-columns: 1.05fr 1fr; gap: 44px; align-items:center; }
@media (max-width: 800px){ .start-wrap{ grid-template-columns: 1fr; gap: 30px; } }
.intro{ position:relative; padding: 6px 4px; }
.glow{ position:absolute; top:-60px; left:-60px; width:260px; height:260px; background: radial-gradient(circle, rgba(156,95,224,0.4), transparent 70%); filter: blur(10px); pointer-events:none; animation: pulse 6s ease-in-out infinite; }
@keyframes pulse{ 0%,100%{ opacity:.55; } 50%{ opacity:1; } }
.site-tag{ font-family:'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--copper-300); display:inline-flex; align-items:center; gap: 8px; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid rgba(211,176,247,0.25); }
.site-tag::before{ content:""; width: 6px; height:6px; border-radius:50%; background: var(--copper-400); box-shadow: 0 0 8px var(--copper-400); display:inline-block; }
.eyebrow{ font-family:'IBM Plex Mono', monospace; font-size: 11.5px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--teal-300); display:flex; align-items:center; gap: 10px; margin-bottom: 18px; }
.eyebrow::before{ content:""; width: 22px; height:1px; background: var(--teal-400); display:inline-block; }
.brand-mark{ font-family:'Special Elite', monospace; font-size: clamp(38px, 6.2vw, 58px); line-height: 1.02; letter-spacing: 0.01em; color: var(--cream); text-shadow: 1px 1px 0 rgba(0,0,0,0.4), 0 0 34px rgba(201,124,77,0.18); margin: 0 0 20px; }
.brand-mark span{ color: var(--copper-400); }
.sub{ color: var(--cream-dim); font-size: 16px; line-height: 1.65; max-width: 46ch; margin: 0 0 28px; }
.mini-stats{ display:flex; gap: 28px; flex-wrap:wrap; }
.mini-stat .n{ font-family:'IBM Plex Mono', monospace; font-weight:700; font-size: 22px; color: var(--copper-300); }
.mini-stat .l{ font-size: 11px; letter-spacing: 0.08em; text-transform:uppercase; color: var(--cream-faint); margin-top: 2px; }
.illustration{ margin-top: 34px; opacity: 0.92; }
@media (max-width: 800px){ .illustration{ display:none; } }
.illustration svg{ overflow: visible; }
#paper-group{ animation: paperFeed 3s ease-in-out infinite; }
@keyframes paperFeed{ 0%{ transform: translateY(0); } 18%{ transform: translateY(-10px); } 95%{ transform: translateY(-10px); } 100%{ transform: translateY(0); } }
#letter-glyph{ opacity: 0; animation: letterAppear 3s ease-in-out infinite; }
@keyframes letterAppear{ 0%, 20%{ opacity: 0; transform: translateY(2px) scale(0.9); } 30%{ opacity: 1; transform: translateY(0) scale(1); } 50%{ opacity: 1; transform: translateY(0) scale(1); } 60%, 100%{ opacity: 0; transform: translateY(2px) scale(0.9); } }
#carriage-group{ animation: carriageShift 3s ease-in-out infinite; }
@keyframes carriageShift{ 0%, 42%{ transform: translateX(0); } 76%{ transform: translateX(22px); } 79%{ transform: translateX(22px); } 81%{ transform: translateX(0); } 100%{ transform: translateX(0); } }
#bell-dot{ opacity: 0; transform-origin: center; animation: bellDing 3s ease-in-out infinite; }
@keyframes bellDing{ 0%, 78%{ opacity: 0; transform: scale(0.5); } 81%{ opacity: 1; transform: scale(1.4); } 88%{ opacity: 0; transform: scale(0.6); } 100%{ opacity: 0; transform: scale(0.5); } }
@media (prefers-reduced-motion: reduce){ #paper-group, #letter-glyph, #carriage-group, #bell-dot{ animation: none !important; } }
.ticket{ background: repeating-linear-gradient(var(--paper-100) 0px, var(--paper-100) 30px, var(--paper-line) 31px, var(--paper-100) 32px), var(--paper-100); border: 1px solid var(--paper-shadow); border-radius: var(--r-lg); padding: 30px 28px; box-shadow: var(--shadow-deep), inset 0 1px 0 rgba(255,255,255,0.5); backdrop-filter: blur(8px); }
.field-label{ font-family:'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--copper-700); margin-bottom: 12px; display:flex; align-items:center; gap:8px; }
.field-label svg{ width:13px; height:13px; opacity:0.85; }
.field{ margin-bottom: 26px; }
.key-row{ display:flex; gap:10px; flex-wrap:wrap; }
.key{ font-family:'Special Elite', monospace; font-weight: 400; font-size: 16px; letter-spacing: 0.02em; color: var(--ink-text); background: radial-gradient(120% 150% at 30% 15%, var(--paper-100) 0%, var(--paper-200) 55%, var(--paper-300) 100%); border: 1px solid var(--paper-shadow); border-bottom: 3px solid var(--copper-700); border-radius: 40px; padding: 11px 22px; cursor:pointer; box-shadow: 0 3px 0 rgba(92,60,120,0.35), 0 8px 14px rgba(20,12,35,0.28), inset 0 2px 1px rgba(255,255,255,0.7), inset 0 -3px 5px rgba(92,60,120,0.18); transition: transform .12s ease, box-shadow .12s ease, background .15s ease, border-color .15s ease, color .15s ease; }
.key:hover{ transform: translateY(-2px); }
.key:active{ transform: translateY(1px); border-bottom-width: 1px; }
.key.active{ background: radial-gradient(130% 160% at 30% 15%, #f0d9a0 0%, #d3a94f 32%, #a67a2e 68%, #7a5620 100%); border-color: #5c3f18; border-bottom-color: #5c3f18; color: #3a2708; text-shadow: 0 1px 0 rgba(255,240,210,0.4); box-shadow: 0 2px 0 #5c3f18, inset 0 2px 4px rgba(58,39,8,0.4), inset 0 -1px 0 rgba(255,247,225,0.25); }
.key.active:hover{ transform: translateY(-1px); }
.key-space{ width:100%; display:flex; align-items:center; justify-content:center; gap: 10px; font-size: 16px; padding: 16px 20px; margin-top: 6px; }
.key-space svg{ width:16px; height:16px; transition: transform .15s ease; }
.key-space:hover svg{ transform: translateX(4px); }
.hint-row{ display:flex; align-items:center; gap: 8px; margin-top: 14px; color: var(--ink-text-soft); font-size: 12.5px; }
.hint-row svg{ width:14px; height:14px; flex-shrink:0; opacity:0.7; }
.game-wrap{ display:none; position:relative; }
.game-wrap.active{ display:block; }
.start-wrap.hidden, .end-wrap.hidden{ display:none; }
.top-row{ display:flex; justify-content:space-between; align-items:center; margin-bottom: 18px; position:relative; z-index:10000; }
.top-row .eyebrow{ margin:0; }
.icon-btn{ width: 38px; height:38px; border-radius: 50%; background: linear-gradient(180deg, var(--ink-700), var(--ink-800)); border: 1px solid rgba(243,236,216,0.14); color: var(--cream); display:flex; align-items:center; justify-content:center; box-shadow: var(--shadow-soft); transition: transform .12s ease, border-color .15s ease; }
.icon-btn:hover{ transform: translateY(-2px); border-color: var(--copper-400); }
.icon-btn svg{ width:17px; height:17px; }
.console{ display:grid; grid-template-columns: repeat(4, 1fr); background: repeating-linear-gradient(var(--paper-100) 0px, var(--paper-100) 30px, var(--paper-line) 31px, var(--paper-100) 32px), var(--paper-100); border: 1px solid var(--paper-shadow); border-radius: var(--r-md); box-shadow: var(--shadow-soft), inset 0 1px 0 rgba(255,255,255,0.5); margin-bottom: 20px; overflow:hidden; }
.gauge{ padding: 16px 8px; text-align:center; position:relative; display:flex; flex-direction:column; align-items:center; gap: 4px; }
.gauge:not(:last-child)::after{ content:""; position:absolute; right:0; top:18%; bottom:18%; width:1px; background: var(--paper-shadow); opacity: 0.5; }
.gauge svg{ width:15px; height:15px; color: var(--copper-700); opacity:0.85; margin-bottom:2px; }
.gauge-val{ font-family:'Special Elite', monospace; font-weight:400; font-size: clamp(21px, 3.9vw, 27px); color: var(--ink-text); line-height:1; }
.gauge-val.warn{ color: var(--ribbon-600); }
.gauge-val.streak-hot{ color: var(--ribbon-600); text-shadow: 0 0 12px rgba(194,52,104,0.55); animation: streakPop .32s ease; }
@keyframes streakPop{ 0%{ transform: scale(1.4); } 60%{ transform: scale(0.95); } 100%{ transform: scale(1); } }
.gauge-lab{ font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-text-soft); }
.streak-popup-layer{ position:absolute; inset:0; pointer-events:none; overflow:visible; z-index:6; }
.streak-popup{ position:absolute; top:38%; left:50%; transform: translate(-50%,-50%) scale(0.6) rotate(var(--rot, 0deg)); font-family:'Special Elite', monospace; font-size: 12.5px; letter-spacing: 0.02em; white-space: nowrap; color: var(--ribbon-600); background: rgba(248,242,252,0.95); border: 1.5px solid var(--ribbon-500); padding: 3px 9px; border-radius: 999px; box-shadow: 0 6px 12px rgba(20,12,35,0.32); opacity: 0; animation: streakPopFloat .85s cubic-bezier(.22,.9,.25,1) forwards; }
.streak-popup.milestone{ font-size: 15px; padding: 6px 14px; color: #3a2708; background: radial-gradient(130% 160% at 30% 15%, #f0d9a0 0%, #d3a94f 40%, #a67a2e 100%); border-color: #5c3f18; text-shadow: 0 1px 0 rgba(255,240,210,0.5); animation: streakPopFloat 1.15s cubic-bezier(.2,.9,.25,1) forwards; }
@keyframes streakPopFloat{ 0%{ opacity:0; transform: translate(-50%,-50%) scale(0.5) rotate(var(--rot, 0deg)) translateY(0); } 18%{ opacity:1; transform: translate(-50%,-50%) scale(1.15) rotate(var(--rot, 0deg)) translateY(-8px); } 35%{ transform: translate(-50%,-50%) scale(1) rotate(var(--rot, 0deg)) translateY(-14px); } 100%{ opacity:0; transform: translate(-50%,-50%) scale(0.92) rotate(var(--rot, 0deg)) translateY(-52px); } }
.paper-frame{ position:relative; filter: drop-shadow(0 22px 34px rgba(5,15,14,0.55)); }
.rollers{ position:relative; height: 16px; margin: 0 26px; z-index:2; }
.rollers .roll{ position:absolute; top:0; width:16px; height:16px; border-radius:50%; background: radial-gradient(circle at 32% 28%, #5a3f78, #1c1228 72%); box-shadow: 0 2px 3px rgba(0,0,0,0.45); }
.rollers .roll.l{ left:0; } .rollers .roll.r{ right:0; }
.rollers .bar{ position:absolute; left:16px; right:16px; top:7px; height:2px; background: linear-gradient(90deg, transparent, var(--brass-400), transparent); }
.paper-card{ position:relative; background: repeating-linear-gradient(var(--paper-100) 0px, var(--paper-100) 30px, var(--paper-line) 31px, var(--paper-100) 32px), var(--paper-100); clip-path: polygon(0% 0%, 100% 0%, 100% 97%, 93.75% 100%, 87.5% 97%, 81.25% 100%, 75% 97%, 68.75% 100%, 62.5% 97%, 56.25% 100%, 50% 97%, 43.75% 100%, 37.5% 97%, 31.25% 100%, 25% 97%, 18.75% 100%, 12.5% 97%, 6.25% 100%, 0% 97%); padding-top: 14px; padding-bottom: 16px; }
.paper-card.return-snap{ animation: carriageReturn .34s cubic-bezier(.22,.9,.28,1); }
@keyframes carriageReturn{ 0%{ transform: translateX(0) rotate(0deg); } 28%{ transform: translateX(16px) rotate(0.25deg); } 100%{ transform: translateX(0) rotate(0deg); } }
.paper-card.shake{ animation: paperShake .3s ease; }
@keyframes paperShake{ 0%,100%{ transform: translateX(0); } 20%{ transform: translateX(-7px) rotate(-0.5deg); } 40%{ transform: translateX(6px) rotate(0.4deg); } 60%{ transform: translateX(-4px); } 80%{ transform: translateX(3px); } }
.letters-badge{ position:absolute; top: 14px; left: 22px; z-index: 4; font-family:'IBM Plex Mono', monospace; font-size: 12.5px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--copper-700); opacity: 0.85; }
.ladder-stage{ position:relative; height: 320px; margin: 6px 26px 0; display:flex; align-items:center; justify-content:center; overflow:hidden; }
.ladder-ring{ position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
.ladder-ring .ring-track{ fill:none; stroke: var(--paper-shadow); stroke-width: 3; opacity: 0.35; }
.ladder-ring .ring-progress{ fill:none; stroke: var(--copper-500); stroke-width: 3; stroke-linecap: round; stroke-dasharray: 917.35; stroke-dashoffset: 0; transform-origin: 150px 150px; transform: rotate(-90deg); }
.ladder-ring .ring-progress.low{ stroke: var(--ribbon-500); animation: ringUrgentPulse .5s ease-in-out infinite; }
@keyframes ringUrgentPulse{ 0%,100%{ filter:brightness(1); } 50%{ filter:brightness(1.5); } }
.ladder-ring .dot{ fill: var(--copper-500); opacity: 0.4; }
.word-ladder{ position:relative; width:100%; height: 100%; overflow:hidden; mask-image: linear-gradient(to bottom, transparent 0%, black 26%, black 74%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 26%, black 74%, transparent 100%); }
.ladder-track{ position:absolute; left:0; right:0; top:50%; display:flex; flex-direction:column; align-items:center; transform: translateY(-50%); }
.ladder-row{ height: 54px; display:flex; align-items:center; justify-content:center; gap: 8px; font-family:'Special Elite', monospace; letter-spacing: 0.02em; white-space: nowrap; }
.ladder-row.done{ font-size: 19px; color: var(--teal-500); opacity: 0.85; }
.ladder-row.done .tick{ color: var(--teal-500); font-family:'Inter', sans-serif; }
.ladder-row.done.wrong{ color: var(--ribbon-500); }
.ladder-row.done.wrong .w{ text-decoration: line-through; text-decoration-color: var(--ribbon-500); }
.ladder-row.done.wrong .tick{ color: var(--ribbon-500); font-family:'Inter', sans-serif; }
.ladder-row.next{ font-size: 19px; color: var(--ink-text-soft); opacity: 0.4; }
.ladder-row.current{ font-size: clamp(32px, 7.4vw, 46px); color: var(--ink-text); height: 66px; }
.ladder-row.current .ch{ display:inline-block; }
.ladder-row.current .ch.correct{ color: var(--copper-700); }
.ladder-row.current .ch.incorrect{ color: var(--ribbon-500); text-decoration: underline wavy var(--ribbon-500); }
.ladder-row.current .ch.pending{ color: var(--ink-text); opacity:0.5; }
.ladder-row.current .ch.correct.stamp{ animation: charStamp .16s ease-out; }
.ladder-row.current .caret{ display:inline-block; width:2px; height: 0.9em; background: var(--ribbon-500); margin-left:1px; animation: blink 1s step-end infinite; }
@keyframes blink{ 50%{ opacity:0; } }
@keyframes charStamp{ 0%{ transform: scale(1.65) translateY(-2px); color: var(--ribbon-500); text-shadow: 0 0 10px rgba(194,52,104,0.5); } 100%{ transform: scale(1) translateY(0); } }
.bell-indicator{ position:absolute; top: 14px; right: 22px; z-index:4; width: 17px; height: 17px; color: var(--teal-500); opacity: 0.32; transform-origin: 50% 20%; transition: opacity .25s ease; pointer-events:none; }
.bell-indicator.ring{ opacity: 1; animation: bellRing .55s cubic-bezier(.36,.07,.19,.97); }
@keyframes bellRing{ 0%{ transform: rotate(0deg) scale(1); } 15%{ transform: rotate(-20deg) scale(1.18); } 32%{ transform: rotate(15deg) scale(1.1); } 50%{ transform: rotate(-10deg) scale(1.04); } 68%{ transform: rotate(6deg); } 84%{ transform: rotate(-2deg); } 100%{ transform: rotate(0deg) scale(1); } }
.impact-ring{ position:absolute; left:50%; top:58%; width:12px; height:12px; margin:-6px 0 0 -6px; border-radius:50%; border: 1.5px solid var(--copper-400); opacity:0; pointer-events:none; }
.impact-ring.ping{ animation: ringpop .42s ease-out; }
@keyframes ringpop{ 0%{ opacity:.75; transform: scale(0.3); } 100%{ opacity:0; transform: scale(3.4); } }
.flash{ position:absolute; inset:0; pointer-events:none; background: radial-gradient(circle at 50% 58%, rgba(184,138,240,0.55), rgba(184,138,240,0) 62%); opacity:0; }
.flash.hit{ animation: flashpop .3s ease; }
@keyframes flashpop{ 0%{ opacity:1; } 100%{ opacity:0; } }
.countdown-overlay{ position:absolute; inset:0; z-index:10; display:flex; align-items:center; justify-content:center; background: rgba(20,12,35,0.86); border-radius: var(--r-md); font-family:'Special Elite', monospace; font-size: clamp(52px, 14vw, 84px); color: var(--cream); letter-spacing:0.02em; text-shadow: 0 0 30px rgba(184,138,240,0.4); }
.countdown-overlay.hidden{ display:none; }
.countdown-overlay.pop{ animation: countdownPop .5s cubic-bezier(.2,.9,.3,1); }
@keyframes countdownPop{ 0%{ transform: scale(0.35); opacity:0; } 45%{ transform: scale(1.18); opacity:1; } 100%{ transform: scale(1); opacity:1; } }
.tap-veil{ position:absolute; inset:0; background: rgba(10,28,26,0.78); display:flex; align-items:center; justify-content:center; border-radius: var(--r-md); font-family:'IBM Plex Mono', monospace; color: var(--cream); font-size:13.5px; letter-spacing:0.04em; text-align:center; padding: 20px; gap:10px; flex-direction:column; }
.tap-veil.hidden{ display:none; }
.tap-veil svg{ width:26px; height:26px; opacity:0.85; }
#hidden-input{ position:absolute; top:0; left:0; width:100%; height:100%; opacity:1; font-size:16px; border:none; outline:none; background:transparent; color:transparent; caret-color:transparent; z-index:9999; pointer-events:auto; }
.game-footer{ display:flex; justify-content:space-between; align-items:center; margin-top: 18px; flex-wrap:wrap; gap:10px; position:relative; z-index:10001; }
.btn-ghost{ background: transparent; color: var(--cream); border: 1.5px solid rgba(243,236,216,0.22); padding: 11px 20px; border-radius: var(--r-sm); font-family:'Special Elite', monospace; font-weight:400; font-size:15.5px; letter-spacing:0.02em; transition: border-color .15s ease, background .15s ease; display:flex; align-items:center; gap:8px; }
.btn-ghost:hover{ border-color: var(--copper-400); background: rgba(201,124,77,0.08); }
.btn-ghost svg{ width:14px; height:14px; }
.end-wrap.panel .btn-ghost{ color: var(--ink-text-soft); background: transparent; border: 2px solid var(--ink-text-soft); border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(41,28,56,0.12); }
.end-wrap.panel .btn-ghost:hover{ border-color: var(--ribbon-600); color: var(--ribbon-600); background: rgba(194,52,104,0.06); }
.mistakes-hint{ font-family:'IBM Plex Mono', monospace; font-size:12.5px; color: var(--cream-faint); }
.end-wrap.panel{ background: repeating-linear-gradient(var(--paper-100) 0px, var(--paper-100) 30px, var(--paper-line) 31px, var(--paper-100) 32px), var(--paper-100); border: 1px solid var(--paper-shadow); border-radius: var(--r-lg); padding: 44px 38px; box-shadow: var(--shadow-deep), inset 0 1px 0 rgba(255,255,255,0.5); text-align:center; }
.end-stamp-wrap{ display:flex; justify-content:center; margin-bottom: 30px; }
.end-stamp{ font-family:'Special Elite', monospace; font-size: clamp(26px, 5.5vw, 36px); color: var(--ribbon-400); border: 3px solid var(--ribbon-500); padding: 8px 22px; border-radius: 8px; transform: rotate(-3deg); letter-spacing: 0.04em; box-shadow: 0 0 0 1px rgba(166,61,64,0.15) inset; }
.end-stamp.stamp-in{ animation: stampSlam .4s cubic-bezier(.18,.9,.32,1.35); }
@keyframes stampSlam{ 0%{ opacity:0; transform: scale(2.4) rotate(-3deg) translateY(-36px); filter: contrast(1.8) brightness(0.75); } 50%{ opacity:1; transform: scale(0.9) rotate(-3deg) translateY(2px); filter: contrast(1.3) brightness(0.9); } 68%{ transform: scale(1.06) rotate(-3deg) translateY(0); } 100%{ transform: scale(1) rotate(-3deg) translateY(0); filter:none; } }
.end-wrap.panel.thump{ animation: panelThump .26s ease; }
@keyframes panelThump{ 0%{ transform: translateY(0); } 32%{ transform: translateY(4px); } 58%{ transform: translateY(-1px); } 100%{ transform: translateY(0); } }
.results-grid{ display:grid; grid-template-columns: repeat(2, 1fr); gap: 0; margin-bottom: 32px; border-top: 1px solid rgba(92,60,120,0.18); }
@media (min-width: 560px){ .results-grid{ grid-template-columns: repeat(3, 1fr); } }
.result{ background: transparent; border: none; border-right: 1px solid rgba(92,60,120,0.18); border-bottom: 1px solid rgba(92,60,120,0.18); border-radius: 0; padding: 16px 12px; box-shadow: none; }
.results-grid > .result:nth-child(2n){ border-right: none; }
@media (min-width: 560px){ .results-grid > .result:nth-child(2n){ border-right: 1px solid rgba(92,60,120,0.18); } .results-grid > .result:nth-child(3n){ border-right: none; } }
.results-grid > .result:nth-last-child(-n+2){ border-bottom: none; }
@media (min-width: 560px){ .results-grid > .result:nth-last-child(-n+2){ border-bottom: 1px solid rgba(92,60,120,0.18); } .results-grid > .result:nth-last-child(-n+3){ border-bottom: none; } }
.result svg{ width:15px; height:15px; color: var(--copper-700); margin-bottom:6px; opacity:0.65; }
.result .val{ font-family:'Special Elite', monospace; font-weight:400; font-size:29px; color: var(--ink-text); }
.result .lab{ font-size:10.5px; letter-spacing:0.12em; text-transform:uppercase; color: var(--ink-text-soft); margin-top:4px; }
.result.stamp-in{ animation: resultStamp .34s cubic-bezier(.2,.9,.3,1.3) both; }
@keyframes resultStamp{ 0%{ opacity:0; transform: scale(1.9) rotate(var(--srot, 0deg)); filter: contrast(1.7) brightness(0.8); } 55%{ opacity:1; transform: scale(0.93) rotate(var(--srot, 0deg)); filter: contrast(1.25) brightness(0.92); } 72%{ transform: scale(1.05) rotate(var(--srot, 0deg)); } 100%{ opacity:1; transform: scale(1) rotate(var(--srot, 0deg)); filter:none; } }
.results-grid .result:nth-child(1){ --srot: -2deg; animation-delay: .05s; } .results-grid .result:nth-child(2){ --srot: 1.5deg; animation-delay: .15s; } .results-grid .result:nth-child(3){ --srot: -1deg; animation-delay: .25s; } .results-grid .result:nth-child(4){ --srot: 2deg; animation-delay: .35s; } .results-grid .result:nth-child(5){ --srot: -1.5deg; animation-delay: .45s; } .results-grid .result:nth-child(6){ --srot: 1deg; animation-delay: .55s; }
.end-actions{ display:flex; gap:14px; flex-wrap:wrap; justify-content:center; }
.btn{ background: radial-gradient(130% 160% at 30% 15%, #f0d9a0 0%, #d3a94f 32%, #a67a2e 68%, #7a5620 100%); color: #3a2708; font-family:'Special Elite', monospace; font-weight:400; font-size:17px; letter-spacing:0.02em; padding: 14px 28px; border-radius: var(--r-sm); border: 1px solid #5c3f18; text-shadow: 0 1px 0 rgba(255,240,210,0.4); box-shadow: 0 4px 0 #5c3f18, 0 10px 18px rgba(15,5,15,0.45), inset 0 2px 1px rgba(255,247,225,0.55), inset 0 -4px 6px rgba(58,39,8,0.4); transition: transform .12s ease, box-shadow .12s ease; display:flex; align-items:center; gap:9px; }
.btn:hover{ transform: translateY(-2px); }
.btn:active{ transform: translateY(3px); box-shadow: 0 1px 0 #5c3f18, inset 0 3px 5px rgba(58,39,8,0.5), inset 0 -1px 0 rgba(255,247,225,0.25); }
.btn svg{ width:15px; height:15px; }
button{ font-family:'Inter', sans-serif; cursor:pointer; border:none; -webkit-tap-highlight-color: transparent; }
@media (prefers-reduced-motion: reduce){ *{ animation-duration: 0.001ms !important; animation-iteration-count:1 !important; transition-duration: 0.001ms !important; } }
@media (max-width: 480px){ .ticket{ padding: 24px 20px; } .end-wrap.panel{ padding: 32px 22px; } }
`}</style>
      <div className="stage">
        <div className="start-wrap" id="start-wrap">
          <div className="intro reveal">
            <div className="glow"></div>
            <div className="site-tag">promogames.in</div>
            <div className="eyebrow">A typewriter speed drill</div>
            <h1 className="brand-mark">FAST<span>TYPER</span></h1>
            <p className="sub">Each word rides in on a fresh strip of paper. Type it before the copper line runs out, keep your streak alive, and see how many words per minute you can land.</p>
            <div className="mini-stats">
              <div className="mini-stat"><div className="n">3</div><div className="l">Difficulties</div></div>
              <div className="mini-stat"><div className="n">30-90s</div><div className="l">Round lengths</div></div>
              <div className="mini-stat"><div className="n">&infin;</div><div className="l">Retries</div></div>
            </div>
            <div className="illustration">
              <svg width="260" height="130" viewBox="0 0 260 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="18" y="58" width="200" height="48" rx="10" fill="#332757" stroke="#7c3fc4" strokeOpacity="0.5"/>
                <rect x="30" y="70" width="20" height="12" rx="3" fill="#f8f2fc" opacity="0.9"/>
                <rect x="58" y="70" width="20" height="12" rx="3" fill="#f8f2fc" opacity="0.75"/>
                <rect x="86" y="70" width="20" height="12" rx="3" fill="#f8f2fc" opacity="0.6"/>
                <rect x="114" y="70" width="20" height="12" rx="3" fill="#f8f2fc" opacity="0.75"/>
                <rect x="142" y="70" width="20" height="12" rx="3" fill="#f8f2fc" opacity="0.9"/>
                <rect x="40" y="88" width="150" height="8" rx="4" fill="#7c3fc4" opacity="0.7"/>
                <g id="carriage-group"><circle cx="30" cy="55" r="9" fill="#2a2013" stroke="#d8b96a" strokeWidth="1.5"/><circle cx="206" cy="55" r="9" fill="#2a2013" stroke="#d8b96a" strokeWidth="1.5"/><rect x="34" y="52" width="168" height="2.5" rx="1.25" fill="#d8b96a" opacity="0.7"/></g>
                <circle id="bell-dot" cx="212" cy="48" r="4" fill="#f0d68f"/>
                <g id="paper-group"><rect x="70" y="8" width="90" height="60" rx="3" fill="#f8f2fc" stroke="#b89bd6" transform="rotate(-2 115 38)"/><line x1="82" y1="24" x2="150" y2="24" stroke="#b89bd6" strokeWidth="2" transform="rotate(-2 115 38)"/><line x1="82" y1="34" x2="140" y2="34" stroke="#b89bd6" strokeWidth="2" transform="rotate(-2 115 38)"/><line x1="82" y1="44" x2="146" y2="44" stroke="#b89bd6" strokeWidth="2" transform="rotate(-2 115 38)"/><text id="letter-glyph" x="112" y="40" fontFamily="'Special Elite', monospace" fontSize="18" fill="#5b2d94" transform="rotate(-2 115 38)">A</text></g>
              </svg>
            </div>
          </div>
          <div className="ticket reveal">
            <div className="field">
              <label className="field-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/></svg>
                Difficulty
              </label>
              <div className="key-row" id="difficulty-row">
                <button className="key" data-diff="easy">Easy</button>
                <button className="key active" data-diff="medium">Medium</button>
                <button className="key" data-diff="hard">Hard</button>
              </div>
            </div>
            <div className="field">
              <label className="field-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                Round length
              </label>
              <div className="key-row" id="duration-row">
                <button className="key" data-dur="30">30s</button>
                <button className="key active" data-dur="60">60s</button>
                <button className="key" data-dur="90">90s</button>
              </div>
            </div>
            <button className="key key-space" id="start-btn">
              Start typing
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
            <div className="hint-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12"/></svg>
              Works with a keyboard or your phone&apos;s keyboard
            </div>
          </div>
        </div>
        <div className="game-wrap" id="game-wrap">
          <input id="hidden-input" type="text" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck="false" inputMode="text" data-lpignore="true" data-1p-ignore="true" data-gramm="false"/>
          <div className="top-row">
            <div className="eyebrow">Round in progress</div>
            <button className="icon-btn" id="sound-toggle" aria-label="Toggle sound"></button>
          </div>
          <div className="paper-frame">
            <div className="rollers"><div className="roll l"></div><div className="bar"></div><div className="roll r"></div></div>
            <div className="paper-card">
              <div className="countdown-overlay hidden" id="countdown-overlay"></div>
              <div className="letters-badge" id="letters-badge">3 letters</div>
              <div className="ladder-stage">
                <svg className="ladder-ring" viewBox="0 0 300 300" aria-hidden="true">
                  <circle className="ring-track" cx="150" cy="150" r="146"/>
                  <circle className="ring-progress" id="ring-progress" cx="150" cy="150" r="146"/>
                  <circle className="dot" cx="150" cy="6" r="3.4"/><circle className="dot" cx="272" cy="82" r="3.4"/><circle className="dot" cx="272" cy="218" r="3.4"/><circle className="dot" cx="150" cy="294" r="3.4"/><circle className="dot" cx="28" cy="218" r="3.4"/><circle className="dot" cx="28" cy="82" r="3.4"/>
                </svg>
                <div className="flash" id="flash"></div>
                <div className="impact-ring" id="impact-ring"></div>
                <svg id="bell-indicator" className="bell-indicator" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <div className="word-ladder" id="word-ladder"><div className="ladder-track" id="ladder-track"></div></div>
              </div>
              <div className="tap-veil" id="tap-veil">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12"/></svg>
                Tap here to bring up your keyboard and start typing
              </div>
            </div>
          </div>
          <div className="console">
            <div className="gauge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
              <div className="gauge-val" id="stat-time">60</div>
              <div className="gauge-lab">Seconds</div>
            </div>
            <div className="gauge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/></svg>
              <div className="gauge-val" id="stat-wpm">0</div>
              <div className="gauge-lab">WPM</div>
            </div>
            <div className="gauge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></svg>
              <div className="gauge-val" id="stat-acc">100%</div>
              <div className="gauge-lab">Accuracy</div>
            </div>
            <div className="gauge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2c1 4-4 5-4 9a4 4 0 0 0 8 0c0-1.5-1-2.5-1-2.5S16 11 16 14a6 6 0 0 1-12 0C4 8 9 7 12 2Z"/></svg>
              <div className="gauge-val" id="stat-streak">0</div>
              <div className="gauge-lab">Streak</div>
              <div className="streak-popup-layer" id="streak-popup-layer"></div>
            </div>
          </div>
          <div className="game-footer">
            <button className="btn-ghost" id="quit-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
              End round
            </button>
            <span className="mistakes-hint" id="mistakes-hint">0 mistakes</span>
          </div>
        </div>
        <div className="end-wrap panel hidden" id="end-wrap">
          <div className="end-stamp-wrap"><div className="end-stamp">TIME&apos;S UP</div></div>
          <div className="results-grid">
            <div className="result"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/></svg><div className="val" id="res-wpm">0</div><div className="lab">Words / min</div></div>
            <div className="result"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></svg><div className="val" id="res-acc">0%</div><div className="lab">Accuracy</div></div>
            <div className="result"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2c1 4-4 5-4 9a4 4 0 0 0 8 0c0-1.5-1-2.5-1-2.5S16 11 16 14a6 6 0 0 1-12 0C4 8 9 7 12 2Z"/></svg><div className="val" id="res-streak">0</div><div className="lab">Best streak</div></div>
            <div className="result"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19h16M7 15l3-3 3 2 4-5"/></svg><div className="val" id="res-words">0</div><div className="lab">Words typed</div></div>
            <div className="result"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg><div className="val" id="res-mistakes">0</div><div className="lab">Mistakes</div></div>
            <div className="result"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 15 9l7 1-5 5 1.5 7L12 18l-6.5 4L7 15l-5-5 7-1Z"/></svg><div className="val" id="res-score">0</div><div className="lab">Score</div></div>
          </div>
          <div className="end-actions">
            <button className="btn" id="retry-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>
              Type again
            </button>
            <button className="btn-ghost" id="settings-btn">Change settings</button>
          </div>
        </div>
        </div>
        </div>
  )
}
