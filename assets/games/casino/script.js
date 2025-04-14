let playerHand = [];
let dealerHand = [];
let blackjackBet = 0;

function startGame() {
  const username = document.getElementById('username-input').value.trim();
  if (!username) {
    alert('Please enter a username!');
    return;
  }
  localStorage.setItem('casino-username', username);
  localStorage.setItem('casino-money', 1000);
  localStorage.setItem('casino-level', 1);
  localStorage.setItem('casino-xp', 0);
  localStorage.setItem('casino-blackjack-wins', 0);
  localStorage.setItem('casino-slots-wins', 0);
  localStorage.setItem('casino-roulette-wins', 0);
  localStorage.setItem('casino-horse-wins', 0);
  localStorage.setItem('casino-war-wins', 0);
  localStorage.setItem('casino-coinflip-wins', 0);
  localStorage.setItem('casino-crash-wins', 0);
  localStorage.setItem('casino-keno-wins', 0);
  showScreen('main-menu');
  updateUI();
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  updateUI();
}

function updateUI() {
  const username = localStorage.getItem('casino-username') || 'Player';
  const money = parseInt(localStorage.getItem('casino-money')) || 0;
  const level = parseInt(localStorage.getItem('casino-level')) || 1;
  const xp = parseInt(localStorage.getItem('casino-xp')) || 0;
  const xpToNext = level * 100;

  const ids = ['blackjack', 'slots', 'roulette', 'horse', 'war', 'coinflip', 'crash', 'keno'];
  ids.forEach(id => {
    const moneyElem = document.getElementById(`${id}-money`);
    if (moneyElem) moneyElem.innerText = money;
  });

  document.getElementById('player-username').innerText = username;
  document.getElementById('player-money').innerText = money;
  document.getElementById('player-level').innerText = level;
  document.getElementById('player-xp').innerText = xp;
  document.getElementById('player-xp-max').innerText = xpToNext;
  document.getElementById('xp-progress').style.width = `${Math.min(100, (xp / xpToNext) * 100)}%`;

  document.getElementById('stats-username').innerText = username;
  document.getElementById('stats-money').innerText = money;
  document.getElementById('stats-level').innerText = level;
  document.getElementById('stats-xp').innerText = xp;
  ['blackjack', 'slots', 'roulette', 'horse', 'war', 'coinflip', 'crash', 'keno'].forEach(game => {
    document.getElementById(`stats-${game}-wins`).innerText = localStorage.getItem(`casino-${game}-wins`) || 0;
  });
}

function returnToMenu() {
  document.querySelectorAll('p[id$="result"], p[id$="message"]').forEach(p => p.innerText = '');
  document.querySelectorAll('span#slots-reels').forEach(p => p.innerText = '- - -');
  document.getElementById('blackjack-game')?.classList.add('hidden');
  showScreen('main-menu');
}

function updateStats(game, amount, xp) {
  let money = parseInt(localStorage.getItem('casino-money'));
  let currentXp = parseInt(localStorage.getItem('casino-xp'));
  let wins = parseInt(localStorage.getItem(`casino-${game}-wins`));

  money += amount;
  currentXp += xp;
  if (amount > 0) wins += 1;

  localStorage.setItem('casino-money', money);
  localStorage.setItem('casino-xp', currentXp);
  localStorage.setItem(`casino-${game}-wins`, wins);
  updateUI();
}

// Slots Game
function playSlots() {
  const bet = parseInt(document.getElementById('slots-bet').value);
  let money = parseInt(localStorage.getItem('casino-money'));

  if (!bet || bet <= 0 || bet > money) {
    alert('Invalid bet amount.');
    return;
  }

  money -= bet;
  localStorage.setItem('casino-money', money);

  const symbols = ['🍒', '🍋', '🔔', '💎', '7️⃣'];
  const reels = document.querySelectorAll('#slots-reels .reel');

  reels.forEach(reel => {
    const result = symbols[Math.floor(Math.random() * symbols.length)];
    const span = reel.querySelector('span');
    span.style.animation = 'none';
    span.offsetHeight;
    span.textContent = result;
    span.style.animation = '';
    span.style.animation = 'spinReel 0.5s ease-out';
  });

  setTimeout(() => {
    const results = Array.from(reels).map(reel => reel.querySelector('span').textContent);
    const [a, b, c] = results;

    let winnings = 0;
    let xp = 0;
    let message = 'You lost.';

    if (a === b && b === c) {
      winnings = bet * 5;
      xp = 15;
      message = `Jackpot! ${a} ${b} ${c} — You won $${winnings}!`;
    } else if (a === b || b === c || a === c) {
      winnings = bet * 2;
      xp = 5;
      message = `Nice! You matched two and won $${winnings}!`;
    }

    document.getElementById('slots-message').innerText = message;
    updateStats('slots', winnings, xp);
  }, 500);
}

// Roulette Game
function playRoulette() {
  const bet = parseInt(document.getElementById('roulette-bet').value);
  const choice = document.getElementById('roulette-choice').value;
  let money = parseInt(localStorage.getItem('casino-money'));

  if (!bet || bet <= 0 || bet > money) {
    alert('Invalid bet amount.');
    return;
  }

  money -= bet;
  localStorage.setItem('casino-money', money);

  const wheel = document.getElementById('roulette-animation');
  wheel.style.animation = 'none';
  wheel.offsetHeight;
  wheel.style.animation = 'spinRoulette 1s ease-out';

  setTimeout(() => {
    const outcome = Math.floor(Math.random() * 37);
    const color = outcome === 0 ? 'green' : outcome % 2 === 0 ? 'black' : 'red';

    let resultText = `The ball landed on ${outcome} (${color}). You lost.`;
    let winnings = 0;
    let xp = 0;

    if (color === choice) {
      winnings = choice === 'green' ? bet * 14 : bet * 2;
      resultText = `The ball landed on ${outcome} (${color}). You won $${winnings}!`;
      xp = choice === 'green' ? 20 : 10;
    }

    document.getElementById('roulette-result').innerText = resultText;
    updateStats('roulette', winnings, xp);
  }, 1000);
}

// Crash Game
function playCrash() {
  const bet = parseInt(document.getElementById('crash-bet').value);
  let money = parseInt(localStorage.getItem('casino-money'));

  if (!bet || bet <= 0 || bet > money) {
    alert('Invalid bet amount.');
    return;
  }

  money -= bet;
  localStorage.setItem('casino-money', money);

  const crashBar = document.getElementById('crash-animation');
  crashBar.style.transform = 'scaleX(0)';
  crashBar.offsetHeight;
  crashBar.style.transform = 'scaleX(1)';

  setTimeout(() => {
    const multiplier = (Math.random() * 5 + 1).toFixed(2);
    const cashout = Math.random() * 5 + 1;

    let resultText = `Multiplier reached x${multiplier}. You lost.`;
    let winnings = 0;
    let xp = 0;

    if (cashout < multiplier) {
      winnings = Math.floor(bet * cashout);
      resultText = `You cashed out at x${cashout.toFixed(2)} and won $${winnings}!`;
      xp = 10;
    }

    document.getElementById('crash-result').innerText = resultText;
    updateStats('crash', winnings, xp);
  }, 1000);
}

// (Other game functions stay as they are...)

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('casino-username')) {
    showScreen('main-menu');
  }
});
