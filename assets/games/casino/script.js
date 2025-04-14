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

  document.getElementById('player-username').innerText = username;
  document.getElementById('player-money').innerText = money;
  document.getElementById('player-level').innerText = level;
  document.getElementById('player-xp').innerText = xp;
  document.getElementById('player-xp-max').innerText = xpToNext;
  document.getElementById('xp-progress').style.width = `${Math.min(100, (xp / xpToNext) * 100)}%`;
  document.getElementById('blackjack-money').innerText = money;

  document.getElementById('stats-username').innerText = username;
  document.getElementById('stats-money').innerText = money;
  document.getElementById('stats-level').innerText = level;
  document.getElementById('stats-xp').innerText = xp;
  document.getElementById('stats-blackjack-wins').innerText = localStorage.getItem('casino-blackjack-wins') || 0;
}

function returnToMenu() {
  document.getElementById('blackjack-result').innerText = '';
  document.getElementById('blackjack-game').classList.add('hidden');
  showScreen('main-menu');
}

function getRandomCard() {
  const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  return cards[Math.floor(Math.random() * cards.length)];
}

function calculateTotal(hand) {
  let total = 0;
  let aces = 0;
  hand.forEach(card => {
    if (card === 'A') {
      total += 11;
      aces++;
    } else if (['K', 'Q', 'J'].includes(card)) {
      total += 10;
    } else {
      total += parseInt(card);
    }
  });
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function startBlackjack() {
  const bet = parseInt(document.getElementById('blackjack-bet').value);
  let money = parseInt(localStorage.getItem('casino-money'));
  if (!bet || bet <= 0 || bet > money) {
    alert('Invalid bet amount.');
    return;
  }
  blackjackBet = bet;
  playerHand = [getRandomCard(), getRandomCard()];
  dealerHand = [getRandomCard()];
  money -= bet;
  localStorage.setItem('casino-money', money);
  document.getElementById('blackjack-game').classList.remove('hidden');
  document.getElementById('blackjack-result').innerText = '';
  updateBlackjackUI();
  updateUI();
}

function updateBlackjackUI() {
  document.getElementById('player-cards').innerText = playerHand.join(', ');
  document.getElementById('player-total').innerText = calculateTotal(playerHand);
  document.getElementById('dealer-cards').innerText = dealerHand.join(', ') + ', ?';
}

function hitCard() {
  playerHand.push(getRandomCard());
  const playerTotal = calculateTotal(playerHand);
  updateBlackjackUI();
  if (playerTotal > 21) {
    endBlackjack('lose');
  }
}

function stand() {
  while (calculateTotal(dealerHand) < 17) {
    dealerHand.push(getRandomCard());
  }
  finishBlackjackRound();
}

function finishBlackjackRound() {
  const playerTotal = calculateTotal(playerHand);
  const dealerTotal = calculateTotal(dealerHand);
  let result = '';
  if (dealerTotal > 21 || playerTotal > dealerTotal) {
    result = 'win';
  } else if (playerTotal < dealerTotal) {
    result = 'lose';
  } else {
    result = 'draw';
  }
  endBlackjack(result);
}

function endBlackjack(result) {
  const dealerTotal = calculateTotal(dealerHand);
  document.getElementById('dealer-cards').innerText = dealerHand.join(', ') + ` (${dealerTotal})`;
  let money = parseInt(localStorage.getItem('casino-money'));
  let xp = parseInt(localStorage.getItem('casino-xp'));
  let wins = parseInt(localStorage.getItem('casino-blackjack-wins'));

  if (result === 'win') {
    document.getElementById('blackjack-result').innerText = `You won $${blackjackBet * 2}!`;
    money += blackjackBet * 2;
    xp += 15;
    wins += 1;
  } else if (result === 'draw') {
    document.getElementById('blackjack-result').innerText = 'It\'s a draw! Your bet is returned.';
    money += blackjackBet;
  } else {
    document.getElementById('blackjack-result').innerText = 'You lost.';
  }

  localStorage.setItem('casino-money', money);
  localStorage.setItem('casino-xp', xp);
  localStorage.setItem('casino-blackjack-wins', wins);
  updateUI();
}

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('casino-username')) {
    showScreen('main-menu');
  }
});
