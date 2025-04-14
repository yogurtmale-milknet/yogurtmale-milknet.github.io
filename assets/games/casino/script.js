let playerHand = [];
let dealerHand = [];
let blackjackBet = 0;
let dailyBonusGiven = false;

// Load user data from localStorage or set default values
function loadUserData() {
  const username = localStorage.getItem('casino-username');
  if (username) {
    // Check for daily bonus
    if (isNewDay()) {
      let balance = parseInt(localStorage.getItem('casino-money'));
      balance += 300; // Add daily bonus
      localStorage.setItem('casino-money', balance);
      dailyBonusGiven = true;
    }
  } else {
    alert('Please enter a username!');
    return;
  }
  updateUI();
}

// Check if it's a new day for daily bonus
function isNewDay() {
  const lastLogin = localStorage.getItem('lastLogin');
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  if (!lastLogin || lastLogin !== today) {
    localStorage.setItem('lastLogin', today);
    return true;
  }
  return false;
}

// Export user data to a downloadable file
function exportUserData() {
  const dataStr = JSON.stringify(localStorage);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${localStorage.getItem('casino-username')}_data.json`;
  link.click();
}

// Import user data from a file
function importUserData(file) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const importedData = JSON.parse(event.target.result);
    for (let key in importedData) {
      localStorage.setItem(key, importedData[key]);
    }
    loadUserData(); // Reload user data after import
  };
  reader.readAsText(file);
}

// Save user data to localStorage
function saveUserData() {
  const username = localStorage.getItem('casino-username');
  localStorage.setItem(username, JSON.stringify({
    money: localStorage.getItem('casino-money'),
    level: localStorage.getItem('casino-level'),
    xp: localStorage.getItem('casino-xp')
  }));
}

// Set a new username for the user
function setUsername(newUsername) {
  localStorage.setItem('casino-username', newUsername);
  saveUserData();
  updateUI();
}

// Update balance after a game
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

// Show the main menu and update UI
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  updateUI();
}

// Update the UI with the current player stats
function updateUI() {
  const username = localStorage.getItem('casino-username') || 'Player';
  const money = parseInt(localStorage.getItem('casino-money')) || 0;
  const level = parseInt(localStorage.getItem('casino-level')) || 1;
  const xp = parseInt(localStorage.getItem('casino-xp')) || 0;
  const xpToNext = level * 100;

  document.getElementById('player-username').innerText = username;
  document.getElementById('player-money').innerText = money;
  document.getElementById('player-level').innerText = level;
  document.getElementById('player-xp').innerText = xp;
  document.getElementById('player-xp-max').innerText = xpToNext;
  document.getElementById('xp-progress').style.width = `${Math.min(100, (xp / xpToNext) * 100)}%`;

  ['blackjack', 'slots', 'roulette', 'horse', 'war', 'coinflip', 'crash', 'keno'].forEach(game => {
    document.getElementById(`stats-${game}-wins`).innerText = localStorage.getItem(`casino-${game}-wins`) || 0;
  });
}

// Blackjack Game
function playBlackjack() {
  const bet = parseInt(document.getElementById('blackjack-bet').value);
  let money = parseInt(localStorage.getItem('casino-money'));

  if (!bet || bet <= 0 || bet > money) {
    alert('Invalid bet amount.');
    return;
  }

  money -= bet;
  localStorage.setItem('casino-money', money);

  // Simulate game result (basic example)
  const win = Math.random() < 0.5;
  let message = win ? `You won $${bet * 2}!` : `You lost $${bet}.`;
  updateStats('blackjack', win ? bet * 2 : -bet, win ? 20 : 0);
  document.getElementById('blackjack-message').innerText = message;
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

// Horse Betting Game
function playHorseBetting() {
  const bet = parseInt(document.getElementById('horse-bet').value);
  let money = parseInt(localStorage.getItem('casino-money'));

  if (!bet || bet <= 0 || bet > money) {
    alert('Invalid bet amount.');
    return;
  }

  money -= bet;
  localStorage.setItem('casino-money', money);

  const outcome = Math.floor(Math.random() * 4) + 1; // 4 horses
  const playerHorse = document.getElementById('horse-choice').value;

  let message = `You lost. Horse #${outcome} won.`;
  let winnings = 0;
  let xp = 0;

  if (outcome == playerHorse) {
    winnings = bet * 3; // Win 3x bet if correct
    message = `You won $${winnings}! Horse #${outcome} won.`;
    xp = 15;
  }

  document.getElementById('horse-message').innerText = message;
  updateStats('horse', winnings, xp);
}

// Casino War Game
function playCasinoWar() {
  const bet = parseInt(document.getElementById('war-bet').value);
  let money = parseInt(localStorage.getItem('casino-money'));

  if (!bet || bet <= 0 || bet > money) {
    alert('Invalid bet amount.');
    return;
  }

  money -= bet;
  localStorage.setItem('casino-money', money);

  const playerCard = Math.floor(Math.random() * 13) + 1; // 1-13 (Ace to King)
  const dealerCard = Math.floor(Math.random() * 13) + 1;

  let message = `You lost. Dealer's card (${dealerCard}) was higher.`;
  let winnings = 0;
  let xp = 0;

  if (playerCard > dealerCard) {
    winnings = bet * 2;
    message = `You won $${winnings}! Your card (${playerCard}) was higher.`;
    xp = 10;
  }

  document.getElementById('war-message').innerText = message;
  updateStats('war', winnings, xp);
}

// Coinflip Game
function playCoinflip() {
  const bet = parseInt(document.getElementById('coinflip-bet').value);
  let money = parseInt(localStorage.getItem('casino-money'));

  if (!bet || bet <= 0 || bet > money) {
    alert('Invalid bet amount.');
    return;
  }

  money -= bet;
  localStorage.setItem('casino-money', money);

  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  const playerChoice = document.getElementById('coinflip-choice').value;

  let message = `You lost. The coin landed on ${result}.`;
  let winnings = 0;
  let xp = 0;

  if (result === playerChoice) {
    winnings = bet * 2;
    message = `You won $${winnings}! The coin landed on ${result}.`;
    xp = 5;
  }

  document.getElementById('coinflip-message').innerText = message;
  updateStats('coinflip', winnings, xp);
}

// Keno Game
function playKeno() {
  const bet = parseInt(document.getElementById('keno-bet').value);
  let money = parseInt(localStorage.getItem('casino-money'));

  if (!bet || bet <= 0 || bet > money) {
    alert('Invalid bet amount.');
    return;
  }

  money -= bet;
  localStorage.setItem('casino-money', money);

  const drawnNumbers = Array.from({ length: 20 }, () => Math.floor(Math.random() * 80) + 1);
  const playerNumbers = Array.from(document.getElementsByClassName('keno-number')).map(num => parseInt(num.value));
  const matchedNumbers = playerNumbers.filter(num => drawnNumbers.includes(num));

  let message = `You lost.`;
  let winnings = 0;
  let xp = 0;

  if (matchedNumbers.length > 0) {
    winnings = bet * matchedNumbers.length; 
    message = `You matched ${matchedNumbers.length} numbers: ${matchedNumbers.join(', ')}. You won $${winnings}!`;
    xp = 20;
  }

  document.getElementById('keno-message').innerText = message;
  updateStats('keno', winnings, xp);
}

// Event listener to load user data when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadUserData(); // Load user data on page load
});
