document.addEventListener('DOMContentLoaded', () => {
  // Attach event listeners to game buttons
  document.getElementById('blackjack-btn').addEventListener('click', () => showGameScreen('blackjack'));
  document.getElementById('slots-btn').addEventListener('click', () => showGameScreen('slots'));
  document.getElementById('roulette-btn').addEventListener('click', () => showGameScreen('roulette'));
  document.getElementById('horse-btn').addEventListener('click', () => showGameScreen('horse'));
  document.getElementById('coinflip-btn').addEventListener('click', () => showGameScreen('coinflip'));
  document.getElementById('keno-btn').addEventListener('click', () => showGameScreen('keno'));
});

function showGameScreen(game) {
  // Hide all game screens
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));

  // Show the selected game screen
  document.getElementById(`${game}-screen`).classList.add('active');
}

function returnToMenu() {
  // Hide all game screens and show the main menu
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  document.getElementById('main-menu').classList.add('active');
}

// Blackjack Game Logic
function startBlackjack() {
  const bet = parseInt(document.getElementById('blackjack-bet').value);
  if (isNaN(bet) || bet <= 0 || bet > money) {
    alert('Please enter a valid bet amount.');
    return;
  }
  // Game logic here
  money -= bet;
  document.getElementById('blackjack-money').textContent = money;
  document.getElementById('blackjack-result').textContent = `Game result: ...`;
  localStorage.setItem('money', money);
}

// Slots Game Logic
function startSlots() {
  const bet = parseInt(document.getElementById('slots-bet').value);
  if (isNaN(bet) || bet <= 0 || bet > money) {
    alert('Please enter a valid bet amount.');
    return;
  }
  // Game logic here
  money -= bet;
  document.getElementById('slots-money').textContent = money;
  document.getElementById('slots-result').textContent = `Game result: ...`;
  localStorage.setItem('money', money);
}

// Roulette Game Logic
function startRoulette() {
  const bet = parseInt(document.getElementById('roulette-bet').value);
  if (isNaN(bet) || bet <= 0 || bet > money) {
    alert('Please enter a valid bet amount.');
    return;
  }
  // Game logic here
  money -= bet;
  document.getElementById('roulette-money').textContent = money;
  document.getElementById('roulette-result').textContent = `Game result: ...`;
  localStorage.setItem('money', money);
}

// Horse Betting Game Logic
function startHorseBetting() {
  const bet = parseInt(document.getElementById('horse-bet').value);
  if (isNaN(bet) || bet <= 0 || bet > money) {
    alert('Please enter a valid bet amount.');
    return;
  }
  // Game logic here
  money -= bet;
  document.getElementById('horse-money').textContent = money;
  document.getElementById('horse-result').textContent = `Game result: ...`;
  localStorage.setItem('money', money);
}

// Coin Flip Game Logic
function flipCoin() {
  const bet = parseInt(document.getElementById('coinflip-bet').value);
  if (isNaN(bet) || bet <= 0 || bet > money) {
    alert('Please enter a valid bet amount.');
    return;
  }
  // Game logic here
  money -= bet;
  document.getElementById('coinflip-money').textContent = money;
  document.getElementById('coinflip-result').textContent = `Game result: ...`;
  localStorage.setItem('money', money);
}

// Keno Game Logic
function playKeno() {
  const bet = parseInt(document.getElementById('keno-bet').value);
  if (isNaN(bet) || bet <= 0 || bet > money) {
    alert('Please enter a valid bet amount.');
    return;
  }
  // Game logic here
  money -= bet;
  document.getElementById('keno-money').textContent = money;
  document.getElementById('keno-result').textContent = `Game result: ...`;
  localStorage.setItem('money', money);
}
