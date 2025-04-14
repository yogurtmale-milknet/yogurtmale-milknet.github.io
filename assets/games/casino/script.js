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

// Start the game, setting username and showing the main menu
function startGame() {
  const usernameInput = document.getElementById('username-input').value.trim();
  
  if (usernameInput === "") {
    alert("Please enter a valid username.");
    return;
  }

  // Set the username and store it in localStorage
  setUsername(usernameInput);

  // Show the main menu after setting the username
  showScreen('main-menu');
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
