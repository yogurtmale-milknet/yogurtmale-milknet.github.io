let balance = 1000;
const MAX_BALANCE = 1_000_000_000_000_000;

let playerCards = [];
let dealerCards = [];
let blackjackBet = 0;
let blackjackEnded = true;

function updateBalance() {
    document.getElementById('balance').innerText = `Balance: $${balance.toLocaleString()}`;
}

function showGame(gameId) {
    const games = document.querySelectorAll('.game');
    games.forEach(game => game.style.display = 'none');
    document.getElementById(gameId).style.display = 'block';
}

function getBetAmount() {
    const bet = parseInt(document.getElementById('bet-amount').value);
    if (isNaN(bet) || bet <= 0) {
        alert("Please enter a valid amount.");
        return null;
    }
    if (bet > balance) {
        alert("Sorry Link, I can't let you. Come back when you're a little, mmm.... richer.");
        return null;
    }
    return bet;
}

function addBalance(amount) {
    if (balance + amount >= MAX_BALANCE) {
        balance = MAX_BALANCE;
        alert("You've reached the maximum balance: $1 Quadrillion! Nice job sweat!");
    } else {
        balance += amount;
    }
}

function subtractBalance(amount) {
    balance -= amount;
}

function startHorseRacing() {
    const bet = getBetAmount();
    if (bet === null) return;

    const playerHorse = document.getElementById('horse-selection').value;
    const horses = ['Horse 1', 'Horse 2', 'Horse 3', 'Horse 4'];
    const winner = horses[Math.floor(Math.random() * horses.length)];

    let resultMessage = `You bet on ${playerHorse}. ${winner} wins the race! `;

    if (playerHorse === winner) {
        addBalance(bet);
        resultMessage += `You win $${bet}!`;
    } else {
        subtractBalance(bet);
        resultMessage += `You lose $${bet}.`;
    }

    document.getElementById('race-result').innerText = resultMessage;
    updateBalance();
}

function startBlackjack() {
    const bet = getBetAmount();
    if (bet === null) return;

    blackjackBet = bet;
    blackjackEnded = false;

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
    if (blackjackEnded) return;

    playerCards.push(drawCard());
    showBlackjackCards();
    const total = calculateTotal(playerCards);
    if (total > 21) endBlackjackGame('lose');
}

function stand() {
    if (blackjackEnded) return;

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
    if (blackjackEnded) return;
    blackjackEnded = true;

    let message = '';
    if (result === 'win') {
        addBalance(blackjackBet);
        message = `You win $${blackjackBet}!`;
    } else if (result === 'lose') {
        subtractBalance(blackjackBet);
        message = `You lose $${blackjackBet}.`;
    } else {
        message = "It's a draw!";
    }

    updateBalance();
    document.getElementById('blackjack-status').innerText =
        `${message} Dealer's cards: ${dealerCards.join(', ')} (Total: ${calculateTotal(dealerCards)})`;
}

function playSlots() {
    const bet = getBetAmount();
    if (bet === null) return;

    const symbols = ['🍒', '🍋', '🍊', '🍉', '⭐'];
    const spin = [randomSymbol(symbols), randomSymbol(symbols), randomSymbol(symbols)];

    let resultMessage = `Result: ${spin.join(' ')}`;
    if (spin.every(s => s === spin[0])) {
        const winnings = bet * 5;
        addBalance(winnings);
        resultMessage += `\nJackpot! You win $${winnings}!`;
    } else if (new Set(spin).size === 2) {
        const winnings = bet * 2;
        addBalance(winnings);
        resultMessage += `\nTwo of a kind! You win $${winnings}!`;
    } else {
        subtractBalance(bet);
        resultMessage += `\nYou lose $${bet}.`;
    }

    document.getElementById('slots-result').innerText = resultMessage;
    updateBalance();
}

function randomSymbol(symbols) {
    return symbols[Math.floor(Math.random() * symbols.length)];
}

function flipCoin() {
    const bet = getBetAmount();
    if (bet === null) return;

    const playerChoice = document.getElementById('coin-choice').value;
    const outcomes = ['Heads', 'Tails'];
    const result = outcomes[Math.floor(Math.random() * outcomes.length)];

    let resultMessage = `You chose ${playerChoice}. The coin landed on ${result}. `;

    if (playerChoice === result) {
        addBalance(bet);
        resultMessage += `You win $${bet}!`;
    } else {
        subtractBalance(bet);
        resultMessage += `You lose $${bet}.`;
    }

    document.getElementById('coin-flip-result').innerText = resultMessage;
    updateBalance();
}

function exportBalance() {
    const data = { balance };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'balance.json';
    a.click();

    URL.revokeObjectURL(url);
}

function importBalance() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (typeof data.balance === 'number') {
                balance = Math.min(data.balance, MAX_BALANCE);
                updateBalance();
                alert("Balance imported!");
            } else {
                alert("Invalid file format.");
            }
        } catch (err) {
            alert("Error reading file.");
        }
    };
    reader.readAsText(file);
}
