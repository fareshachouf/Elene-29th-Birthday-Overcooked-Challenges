// --- BASE GAME STATE VARIABLES ---
let totalTasks = 16;
let completedTasks = 0;
let chefClicksLeft = 3;
let chefMoveLoop = null;


// --- AUDIO ELEMENTS ---
const sfxAudio = new Audio('audio1.mp3'); 
const bgMusic = new Audio('audio4.mp3');  
bgMusic.loop = true;

const bossMusic = new Audio('audio2.mp3');[cite: 2]
bossMusic.loop = true;

const victoryMusic = new Audio('audio3.mp3');[cite: 2]


// --- GAMEPLAY CONFIGURATION & BOSS STATE ---
let miniGameClicks = 0;
const miniGameTarget = 5;[cite: 2]

let bossClicks = 0;
const bossTarget = 29;[cite: 2]
let bossAngle = 0;
let bossAnimationId = null;


// --- DOM ELEMENTS & SETUP ---
let overcookedChar;
let blackoutOverlay;
let healthBarContainer;
let healthBarFill;
let dialogueBox;

document.addEventListener('DOMContentLoaded', () => {
  // Bind character element directly
  overcookedChar = document.getElementById('host-img') || document.getElementById('overcooked-character');

  // Create Blackout Overlay
  blackoutOverlay = document.createElement('div');
  blackoutOverlay.id = 'boss-blackout';
  document.body.appendChild(blackoutOverlay);

  // Create Health Bar Element
  healthBarContainer = document.createElement('div');
  healthBarContainer.id = 'boss-health-container';
  healthBarContainer.innerHTML = `<div id="boss-health-fill"></div>`;
  document.body.appendChild(healthBarContainer);
  healthBarFill = document.getElementById('boss-health-fill');

  // Create Dialogue Box Element
  dialogueBox = document.createElement('div');
  dialogueBox.id = 'boss-dialogue-box';
  document.body.appendChild(dialogueBox);

  // Trigger initial spawn check on load
  spawnChef();
});


// --- INITIAL BGM SETUP ---
window.addEventListener('click', () => {
  if (bgMusic.paused && !bossMusic.currentTime && !victoryMusic.currentTime) {
    bgMusic.play().catch(() => {});
  }
}, { once: true });


// --- CARTOONISH PUNCH & SOUND FX ---
function playCheesySFX(type) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  
  if (type === 'punch') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } else if (type === 'jumpscare') {
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


// --- TASK & TRIVIA COMPLETION ---
function completeTask(id) {
  const card = document.getElementById(id);
  if (card && !card.classList.contains('done')) {
    card.classList.add('done');
    const btn = card.querySelector('button');
    if (btn) {
      btn.disabled = true;
      btn.innerText = '3 Stars Earned ⭐⭐⭐';
    }
    playCheesySFX('win');
    completedTasks++;
    updateXP();
  }
}

function answerTrivia(id, isCorrect) {
  if (isCorrect) {
    const card = document.getElementById(id);
    if (card && !card.classList.contains('done')) {
      card.classList.add('done');
      card.querySelectorAll('button').forEach(b => b.disabled = true);
      playCheesySFX('win');
      completedTasks++;
      updateXP();
    }
  } else {
    playCheesySFX('jumpscare');
    const overlay = document.getElementById('jumpscare-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      setTimeout(() => overlay.classList.add('hidden'), 900);
    }
  }
}

function updateXP() {
  const percentage = Math.round((completedTasks / totalTasks) * 100);
  const bar = document.getElementById('xp-bar-inner');
  const text = document.getElementById('xp-text');
  
  if (bar) bar.style.width = percentage + '%';
  if (text) text.innerText = `${completedTasks} / ${totalTasks} Objectives Completed (${percentage}%)`;
  
  if (completedTasks === totalTasks) {
    checkAllTasksCompleted();
  }
}


// --- ANNOYING CHARACTER HOST POP-UP LOGIC ---
setInterval(() => {
  if (completedTasks < totalTasks) {
    spawnChef();
  }
}, 60000);

function spawnChef() {
  chefClicksLeft = 3;
  const clickCountElem = document.getElementById('click-count');
  if (clickCountElem) clickCountElem.innerText = chefClicksLeft;
  
  const host = document.getElementById('character-host');
  if (host) host.classList.remove('hidden', 'buffer-mode');
  
  relocateChef();

  if (chefMoveLoop) clearInterval(chefMoveLoop);
  chefMoveLoop = setInterval(relocateChef, 1200);
}

function relocateChef() {
  const wrapper = document.getElementById('host-wrapper');
  if (!wrapper) return;
  
  const isTeleporting = Math.random() < 0.4;
  if (isTeleporting) {
    wrapper.classList.add('teleport');
  } else {
    wrapper.classList.remove('teleport');
  }

  const wrapperWidth = wrapper.offsetWidth || 300;
  const wrapperHeight = wrapper.offsetHeight || 300;

  const maxX = Math.max(10, window.innerWidth - wrapperWidth - 20);
  const maxY = Math.max(10, window.innerHeight - wrapperHeight - 20);
  
  const randomX = Math.floor(Math.random() * maxX);
  const randomY = Math.floor(Math.random() * maxY);
  
  wrapper.style.left = randomX + 'px';
  wrapper.style.top = randomY + 'px';
}

function handleChefClick() {
  if (blackoutOverlay && blackoutOverlay.classList.contains('active')) return;

  sfxAudio.currentTime = 0;
  sfxAudio.play().catch(() => {});

  chefClicksLeft--;
  const clickCountElem = document.getElementById('click-count');
  if (clickCountElem) clickCountElem.innerText = chefClicksLeft;
  
  playCheesySFX('punch');
  
  if (chefClicksLeft > 0) {
    const wrapper = document.getElementById('host-wrapper');
    if (wrapper) wrapper.classList.add('teleport');
    relocateChef();
  } else {
    if (chefMoveLoop) {
      clearInterval(chefMoveLoop);
      chefMoveLoop = null;
    }
    
    const host = document.getElementById('character-host');
    if (host) {
      host.classList.add('buffer-mode');
      setTimeout(() => {
        host.classList.add('hidden');
        host.classList.remove('buffer-mode');
      }, 4000);
    }
  }
}


// --- BOSS FIGHT SEQUENCE ---
function checkAllTasksCompleted() {
  startBossFightSequence();
}

function startBossFightSequence() {
  bgMusic.pause();
  bgMusic.currentTime = 0;

  if (chefMoveLoop) clearInterval(chefMoveLoop);

  blackoutOverlay.classList.add('active');

  showDialogue("Well done Elene, well well done. You've completed all the challenges and your prize awaits", () => {[cite: 2]
    setTimeout(() => {
      // Unhide host wrapper and character directly for boss mode
      const host = document.getElementById('character-host');
      if (host) host.classList.remove('hidden', 'buffer-mode');

      overcookedChar = document.getElementById('host-img') || document.getElementById('overcooked-character');
      if (overcookedChar) {
        overcookedChar.classList.add('boss-mode');
        overcookedChar.style.display = 'block';
        overcookedChar.style.left = '50%';
        overcookedChar.style.top = '50%';
      }

      setTimeout(() => {
        showDialogue("HAHAHAHAHAHAHAHAH! Did you think you could get rid of me that easily? Try your best to get rid of me but I will always be in the way!", () => {[cite: 2]
          startBossBattle();
        });
      }, 5000);
    }, 10000);
  });
}


// --- DIALOGUE HELPER ---
function showDialogue(text, onClickCallback) {
  dialogueBox.innerText = text;
  dialogueBox.style.display = 'block';

  function handleClick() {
    dialogueBox.style.display = 'none';
    dialogueBox.removeEventListener('click', handleClick);
    if (onClickCallback) onClickCallback();
  }

  dialogueBox.addEventListener('click', handleClick);
}


// --- BOSS BATTLE LOGIC ---
function startBossBattle() {
  healthBarContainer.style.display = 'block';
  healthBarFill.style.width = '0%';
  
  let fillProgress = 0;
  const fillInterval = setInterval(() => {
    fillProgress += 2;
    healthBarFill.style.width = fillProgress + '%';
    if (fillProgress >= 100) {
      clearInterval(fillInterval);
      
      bossMusic.play().catch(() => {});[cite: 2]
      animateBossMovement();
      
      if (overcookedChar) {
        overcookedChar.onclick = handleBossClick;
      }
    }
  }, 20);
}

function animateBossMovement() {
  if (!overcookedChar) return;

  bossAngle += 0.03;
  const radius = 100 + Math.sin(bossAngle * 2) * 50; 
  const centerX = window.innerWidth / 2 - 100;
  const centerY = window.innerHeight / 2 - 100;

  const x = centerX + Math.cos(bossAngle) * radius;
  const y = centerY + Math.sin(bossAngle) * radius;

  overcookedChar.style.left = `${x}px`;
  overcookedChar.style.top = `${y}px`;

  bossAnimationId = requestAnimationFrame(animateBossMovement);
}

function handleBossClick() {
  sfxAudio.currentTime = 0;
  sfxAudio.play().catch(() => {});[cite: 2]

  bossClicks++;
  
  const healthPercent = ((bossTarget - bossClicks) / bossTarget) * 100;[cite: 2]
  healthBarFill.style.width = `${Math.max(0, healthPercent)}%`;

  if (bossClicks >= bossTarget) {[cite: 2]
    overcookedChar.onclick = null;
    cancelAnimationFrame(bossAnimationId);
    defeatBoss();
  }
}


// --- BOSS DEFEAT & OUTRO ---
function defeatBoss() {
  bossMusic.pause();[cite: 2]
  bossMusic.currentTime = 0;

  if (overcookedChar) {
    overcookedChar.classList.add('exploding-fade');[cite: 2]
  }

  setTimeout(() => {
    if (overcookedChar) overcookedChar.style.display = 'none';
    healthBarContainer.style.display = 'none';

    victoryMusic.play().catch(() => {});[cite: 2]

    showDialogue("you have defeated the annoying individual that's somehow always in the way, claim your prize Head Chef Elene!", () => {[cite: 2]
      victoryMusic.pause();
      victoryMusic.currentTime = 0;
      blackoutOverlay.classList.remove('active');
      
      const host = document.getElementById('character-host');
      if (host) host.classList.add('hidden');
      
      revealPrizesPage();
    });
  }, 2000);
}


// --- PRIZE VAULT UNLOCK LOGIC ---
function revealPrizesPage() {
  unlockTrollVault();
}

function unlockTrollVault() {
  const lockedVault = document.getElementById('vault-locked');
  const trollVault = document.getElementById('vault-troll');

  if (lockedVault) lockedVault.style.display = 'none';
  if (trollVault) trollVault.style.display = 'block';
  
  if (typeof confetti === 'function') {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  }
}

function revealRealReward() {
  const trollVault = document.getElementById('vault-troll');
  const realVault = document.getElementById('vault-real');

  if (trollVault) trollVault.style.display = 'none';
  if (realVault) realVault.style.display = 'block';
  
  if (typeof confetti === 'function') {
    confetti({ particleCount: 250, spread: 100, origin: { y: 0.5 } });
  }
}