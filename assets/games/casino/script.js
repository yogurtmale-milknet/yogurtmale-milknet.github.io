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

// Blackjack functions (same as before, keeping for integration)...
// Slots function (keep as before)...

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

  const outcome = Math.floor(Math.random() * 37);
  let color = outcome === 0 ? 'green' : outcome % 2 === 0 ? 'black' : 'red';

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
}

// Horse Betting Game
function playHorse() {
  const bet = parseInt(document.getElementById('horse-bet').value);
  const choice = parseInt(document.getElementById('horse-choice').value);
  let money = parseInt(localStorage.getItem('casino-money'));

  if (!bet || bet <= 0 || bet > money) {
    alert('Invalid bet amount.');
    return;
  }

  money -= bet;
  localStorage.setItem('casino-money', money);

  const winningHorse = Math.ceil(Math.random() * 3);
  let resultText = `Horse ${winningHorse} won. You lost.`;
  let winnings = 0;
  let xp = 0;

  if (choice === winningHorse) {
    winnings = bet * 3;
    resultText = `Horse ${winningHorse} won. You won $${winnings}!`;
    xp = 10;
  }

  document.getElementById('horse-result').innerText = resultText;
  updateStats('horse', winnings, xp);
}

// Casino War Game
function playWar() {
  const bet = parseInt(document.getElementById('war-bet').value);
  let money = parseInt(localStorage.getItem('casino-money'));

  if (!bet || bet <= 0 || bet > money) {
    alert('Invalid bet amount.');
    return;
  }

  money -= bet;
  localStorage.setItem('casino-money', money);

  const playerCard = Math.ceil(Math.random() * 13);
  const dealerCard = Math.ceil(Math.random() * 13);

  let resultText = `You drew ${playerCard}, dealer drew ${dealerCard}. You lost.`;
  let winnings = 0;
  let xp = 0;

  if (playerCard > dealerCard) {
    winnings = bet * 2;
    resultText = `You drew ${playerCard}, dealer drew ${dealerCard}. You won $${winnings}!`;
    xp = 10;
  } else if (playerCard === dealerCard) {
    winnings = bet;
    resultText = `It's a tie! Your bet is returned.`;
  }

  document.getElementById('war-result').innerText = resultText;
  updateStats('war', winnings, xp);
}

// Coin Flip Game
function playCoinflip() {
  const bet = parseInt(document.getElementById('coinflip-bet').value);
  const choice = document.getElementById('coinflip-choice').value;
  let money = parseInt(localStorage.getItem('casino-money'));

  if (!bet || bet <= 0 || bet > money) {
    alert('Invalid bet amount.');
    return;
  }

  money -= bet;
  localStorage.setItem('casino-money', money);

  const flip = Math.random() < 0.5 ? 'heads' : 'tails';
  let resultText = `It landed on ${flip}. You lost.`;
  let winnings = 0;
  let xp = 0;

  if (choice === flip) {
    winnings = bet * 2;
    resultText = `It landed on ${flip}. You won $${winnings}!`;
    xp = 5;
  }

  document.getElementById('coinflip-result').innerText = resultText;
  updateStats('coinflip', winnings, xp);
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
}

// Keno Game
function playKeno() {
  const bet = parseInt(document.getElementById('keno-bet').value);
  const picks = document.getElementById('keno-numbers').value.split(',').map(num => parseInt(num.trim())).filter(n => n >= 1 && n <= 10);
  let money = parseInt(localStorage.getItem('casino-money'));

  if (!bet || bet <= 0 || bet > money || picks.length === 0) {
    alert('Invalid bet or picks. Pick numbers between 1-10.');
    return;
  }

  money -= bet;
  localStorage.setItem('casino-money', money);

  const draws = Array.from({ length: 3 }, () => Math.ceil(Math.random() * 10));
  const matches = picks.filter(num => draws.includes(num)).length;

  let resultText = `Drawn numbers: ${draws.join(', ')}. No matches.`;
  let winnings = 0;
  let xp = 0;

  if (matches > 0) {
    winnings = bet * matches * 2;
    resultText = `Drawn numbers: ${draws.join(', ')}. You matched ${matches} numbers and won $${winnings}!`;
    xp = matches * 5;
  }

  document.getElementById('keno-result').innerText = resultText;
  updateStats('keno', winnings, xp);
}

// Init

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('casino-username')) {
    showScreen('main-menu');
  }
});
