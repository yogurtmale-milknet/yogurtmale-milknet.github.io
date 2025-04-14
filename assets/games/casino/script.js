// Global variables to hold player data
let username = '';
let money = 1000;  // Starting money
let level = 1;
let xp = 0;
let xpMax = 100;

// Load user data from localStorage (if any)
function loadUserData() {
  const inputUsername = document.getElementById('username-input').value;
  if (inputUsername) {
    username = inputUsername;
    // Load other data if exists in localStorage
    money = parseInt(localStorage.getItem('money')) || money;
    level = parseInt(localStorage.getItem('level')) || level;
    xp = parseInt(localStorage.getItem('xp')) || xp;
    xpMax = parseInt(localStorage.getItem('xpMax')) || xpMax;
    
    // Set the player data on the main menu
    document.getElementById('player-username').textContent = username;
    document.getElementById('player-money').textContent = money;
    document.getElementById('player-level').textContent = level;
    document.getElementById('player-xp').textContent = xp;
    document.getElementById('player-xp-max').textContent = xpMax;
    document.getElementById('xp-progress').style.width = (xp / xpMax) * 100 + '%';
    
    // Save data to localStorage
    localStorage.setItem('username', username);
    localStorage.setItem('money', money);
    localStorage.setItem('level', level);
    localStorage.setItem('xp', xp);
    localStorage.setItem('xpMax', xpMax);

    // Show the main menu screen
    showScreen('main-menu');
  } else {
    alert('Please enter a username.');
  }
}

// Show a specific screen
function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(screen => {
    screen.classList.remove('active');
  });
  const screenToShow = document.getElementById(screenId);
  if (screenToShow) {
    screenToShow.classList.add('active');
  }
}

// Return to the main menu
function returnToMenu() {
  showScreen('main-menu');
}

// Export user data as JSON
function exportUserData() {
  const userData = {
    username: localStorage.getItem('username'),
    money: localStorage.getItem('money'),
    level: localStorage.getItem('level'),
    xp: localStorage.getItem('xp'),
    xpMax: localStorage.getItem('xpMax'),
  };
  const fileContent = JSON.stringify(userData);
  const blob = new Blob([fileContent], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'userData.json';
  link.click();
}

// Handle daily rewards
function addDailyReward() {
  const lastLogin = localStorage.getItem('lastLogin');
  const today = new Date().toLocaleDateString();
  if (lastLogin !== today) {
    money += 300;  // Add $300 as a daily reward
    localStorage.setItem('lastLogin', today);
    alert('You have received your daily reward of $300!');
  }
  document.getElementById('player-money').textContent = money;
  localStorage.setItem('money', money);
}

// Blackjack game logic
function startBlackjack() {
  const bet = parseInt(document.getElementById('blackjack-bet').value);
  if (isNaN(bet) || bet <= 0) {
    alert('Please enter a valid bet amount.');
    return;
  }
  // Blackjack game logic goes here...
  // Update balance after game logic
  money -= bet;
  document.getElementById('blackjack-money').textContent = money;
  localStorage.setItem('money', money);
}

// Slots game logic
function playSlots() {
  const bet = parseInt(document.getElementById('slots-bet').value);
  if (isNaN(bet) || bet <= 0) {
    alert('Please enter a valid bet amount.');
    return;
  }
  // Simulate a slot machine spin
  const results = ['🍒', '🍉', '🍇', '🍓', '🍊'];
  const reel1 = results[Math.floor(Math.random() * results.length)];
  const reel2 = results[Math.floor(Math.random() * results.length)];
  const reel3 = results[Math.floor(Math.random() * results.length)];

  document.getElementById('slots-reels').innerHTML = `<span class="reel">${reel1}</span><span class="reel">${reel2}</span><span class="reel">${reel3}</span>`;
  // Logic for checking winning and updating balance goes here
  money -= bet;
  document.getElementById('slots-money').textContent = money;
  localStorage.setItem('money', money);
}

// Roulette game logic
function playRoulette() {
  const bet = parseInt(document.getElementById('roulette-bet').value);
  if (isNaN(bet) || bet <= 0) {
    alert('Please enter a valid bet amount.');
    return;
  }
  const choice = document.getElementById('roulette-choice').value;
  const result = Math.floor(Math.random() * 37);  // 0-36 for roulette numbers
  const colors = ['red', 'black', 'green'];
  const color = result === 0 ? 'green' : (result % 2 === 0 ? 'black' : 'red');
  
  let message = `Result: ${result} (${color})`;
  if ((choice === 'red' && color === 'red') || (choice === 'black' && color === 'black') || (choice === 'green' && result === 0)) {
    message += ' - You win!';
    money += bet;
  } else {
    message += ' - You lose.';
    money -= bet;
  }
  document.getElementById('roulette-result').textContent = message;
  document.getElementById('roulette-money').textContent = money;
  localStorage.setItem('money', money);
}

// Horse Betting game logic
function placeHorseBet() {
  const bet = parseInt(document.getElementById('horse-bet').value);
  if (isNaN(bet) || bet <= 0) {
    alert('Please enter a valid bet amount.');
    return;
  }
  // Simulate the horse race (random outcome)
  const winner = Math.floor(Math.random() * 4) + 1;  // 1 to 4 horses
  const message = `Horse ${winner} wins!`;

  if (winner === 1) {  // Let's assume betting on Horse 1 wins
    message += ' - You win!';
    money += bet;
  } else {
    message += ' - You lose.';
    money -= bet;
  }

  document.getElementById('horse-result').textContent = message;
  document.getElementById('horse-money').textContent = money;
  localStorage.setItem('money', money);
}

// Coin Flip game logic
function flipCoin() {
  const bet = parseInt(document.getElementById('coinflip-bet').value);
  if (isNaN(bet) || bet <= 0) {
    alert('Please enter a valid bet amount.');
    return;
  }
  const result = Math.random() > 0.5 ? 'Heads' : 'Tails';
  document.getElementById('coinflip-result').textContent = `Result: ${result}`;
  // Update balance after coin flip outcome
  money -= bet;
  document.getElementById('coinflip-money').textContent = money;
  localStorage.setItem('money', money);
}

// Keno game logic
function playKeno() {
  const bet = parseInt(document.getElementById('keno-bet').value);
  if (isNaN(bet) || bet <= 0) {
    alert('Please enter a valid bet amount.');
    return;
  }
  // Keno logic (random number selection)
  const numbers = [];
  for (let i = 0; i < 5; i++) {
    numbers.push(Math.floor(Math.random() * 80) + 1);  // 1 to 80
  }
  document.getElementById('keno-result').textContent = `Selected Numbers: ${numbers.join(', ')}`;
  // Update balance based on winnings (example)
  money -= bet;
  document.getElementById('keno-money').textContent = money;
  localStorage.setItem('money', money);
}

// Add daily reward if applicable
addDailyReward();
