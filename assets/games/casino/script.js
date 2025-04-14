let balance = 1000;

// Update balance display
function updateBalance() {
    document.getElementById('balance').innerText = `Balance: $${balance}`;
}

// Show selected game
function showGame(gameId) {
    const games = document.querySelectorAll('.game');
    games.forEach(game => game.style.display = 'none');
    document.getElementById(gameId).style.display = 'block';
}

// Get bet amount
function getBetAmount() {
    const bet = parseInt(document.getElementById('bet-amount').value);
    if (bet > balance) {
        alert("You don't have enough balance for this bet.");
        return null;
    }
    if (bet <= 0) {
        alert("Please enter a valid bet amount.");
        return null;
    }
    return bet;
}

// Horse Racing Game
function startHorseRacing() {
    const bet = getBetAmount();
    if (bet === null) return;

    const playerHorse = document.getElementById('horse-selection').value;
    const horses = ['Horse 1', 'Horse 2', 'Horse 3', 'Horse 4'];
    const winner = horses[Math.floor(Math.random() * horses.length)];

    let resultMessage = `You bet on ${playerHorse}. ${winner} wins the race! `;

    if (playerHorse === winner) {
        balance += bet;
        resultMessage += `You win $${bet}!`;
    } else {
        balance -= bet;
        resultMessage += `You lose $${bet}.`;
    }

    document.getElementById('race-result').innerText = resultMessage;
    updateBalance();
}

// Blackjack Game
let playerCards = [];
let dealerCards = [];

function startBlackjack() {
    const bet = getBetAmount();
    if (bet === null) return;

    playerCards = [drawCard(), drawCard()];
    dealerCards = [drawCard(), drawCard()];

    document.getElementById('blackjack-status').innerText = 'Game started. Your move!';
    showBlackjackCards();
}

function drawCard() {
    return Math.floor(Math.random() * 11) + 1;
}

function calculateTotal(cards) {
    return cards.reduce((a, b) => a + b, 0);
}

function showBlackjackCards() {
    document.getElementById('blackjack-cards').innerText =
        `Your cards: ${playerCards.join(', ')} (Total: ${calculateTotal(playerCards)})\n` +
        `Dealer shows: ${dealerCards[0]}`;
}

function hit() {
    playerCards.push(drawCard());
    showBlackjackCards();
    const total = calculateTotal(playerCards);
    if (total > 21) endBlackjackGame('lose');
}

function stand() {
    while (calculateTotal(dealerCards) < 17) {
        dealerCards.push(drawCard());
    }

    const playerTotal = calculateTotal(playerCards);
    const dealerTotal = calculateTotal(dealerCards);

    if (dealerTotal > 21 || playerTotal > dealerTotal) {
        endBlackjackGame('win');
    } else if (playerTotal === dealerTotal) {
        endBlackjackGame('draw');
    } else {
        endBlackjackGame('lose');
    }
}

function endBlackjackGame(result) {
    const bet = getBetAmount();
    if (bet === null) return;

    let message = '';
    if (result === 'win') {
        balance += bet;
        message = `You win $${bet}!`;
    } else if (result === 'lose') {
        balance -= bet;
        message = `You lose $${bet}.`;
    } else {
        message = "It's a draw!";
    }

    updateBalance();
    document.getElementById('blackjack-status').innerText =
        `${message} Dealer's cards: ${dealerCards.join(', ')} (Total: ${calculateTotal(dealerCards)})`;
}

// Slots Game
function playSlots() {
    const bet = getBetAmount();
    if (bet === null) return;

    const symbols = ['🍒', '🍋', '🍊', '🍉', '⭐'];
    const spin = [randomSymbol(symbols), randomSymbol(symbols), randomSymbol(symbols)];

    let resultMessage = `Result: ${spin.join(' ')}`;
    if (spin.every(s => s === spin[0])) {
        balance += bet * 5;
        resultMessage += `\nJackpot! You win $${bet * 5}!`;
    } else if (new Set(spin).size === 2) {
        balance += bet * 2;
        resultMessage += `\nTwo of a kind! You win $${bet * 2}!`;
    } else {
        balance -= bet;
        resultMessage += `\nYou lose $${bet}.`;
    }

    document.getElementById('slots-result').innerText = resultMessage;
    updateBalance();
}

function randomSymbol(symbols) {
    return symbols[Math.floor(Math.random() * symbols.length)];
}

// Coin Flip Game
function flipCoin() {
    const bet = getBetAmount();
    if (bet === null) return;

    const playerChoice = document.getElementById('coin-choice').value;
    const outcomes = ['Heads', 'Tails'];
    const result = outcomes[Math.floor(Math.random() * outcomes.length)];

    let resultMessage = `You chose ${playerChoice}. The coin landed on ${result}. `;

    if (playerChoice === result) {
        balance += bet;
        resultMessage += `You win $${bet}!`;
    } else {
        balance -= bet;
        resultMessage += `You lose $${bet}.`;
    }

    document.getElementById('coin-flip-result').innerText = resultMessage;
    updateBalance();
}
