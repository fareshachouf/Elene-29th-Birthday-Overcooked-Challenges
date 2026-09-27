let totalTasks = 16; // 10 challenges + 6 trivia
let completedTasks = 0;

// Web Audio API Synthesizer (No MP3 download needed for Jumpscare/Cheesy SFX)
function playCheesySFX(type) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  
  if (type === 'jumpscare') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } else if (type === 'win') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(587, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }
}

// Complete Standard Challenge Ticket
function completeTask(id) {
  const card = document.getElementById(id);
  if (!card.classList.contains('done')) {
    card.classList.add('done');
    const btn = card.querySelector('button');
    btn.disabled = true;
    btn.innerText = '3 Stars Earned ⭐⭐⭐';
    
    playCheesySFX('win');
    completedTasks++;
    updateXP();
  }
}

// Answer Trivia Questions
function answerTrivia(id, isCorrect) {
  if (isCorrect) {
    const card = document.getElementById(id);
    if (!card.classList.contains('done')) {
      card.classList.add('done');
      card.querySelectorAll('button').forEach(b => b.disabled = true);
      playCheesySFX('win');
      completedTasks++;
      updateXP();
    }
  } else {
    // TRIGGER JUMPSCARE
    playCheesySFX('jumpscare');
    const overlay = document.getElementById('jumpscare-overlay');
    overlay.classList.remove('hidden');
    
    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 900);
  }
}

// Update Progress Bar
function updateXP() {
  const percentage = Math.round((completedTasks / totalTasks) * 100);
  document.getElementById('xp-bar-inner').style.width = percentage + '%';
  document.getElementById('xp-text').innerText = `${completedTasks} / ${totalTasks} Objectives Completed (${percentage}%)`;
  
  if (completedTasks === totalTasks) {
    unlockTrollVault();
  }
}

// Annoying Character Host Logic (Periodic Blocking)
function moveCharacter() {
  const host = document.getElementById('character-host');
  host.classList.remove('blocking');
  document.getElementById('host-bubble').innerText = "Okay, okay! Back to cooking!";
}

// Periodically jump in front of screen
setInterval(() => {
  const host = document.getElementById('character-host');
  if (completedTasks < totalTasks) {
    host.classList.add('blocking');
    document.getElementById('host-bubble').innerText = "MOVE ME! I'M BLOCKING THE RECIPE!";
  }
}, 45000); // Triggers every 45 seconds

// Unlock Stage 1 (Fake Reward)
function unlockTrollVault() {
  document.getElementById('vault-locked').style.display = 'none';
  document.getElementById('vault-troll').style.display = 'block';
  
  confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
}

// Unlock Stage 2 (Real Gift)
function revealRealReward() {
  document.getElementById('vault-troll').style.display = 'none';
  document.getElementById('vault-real').style.display = 'block';
  
  confetti({ particleCount: 250, spread: 100, origin: { y: 0.5 } });
}