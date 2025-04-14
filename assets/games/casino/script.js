// Switch between game views
function showHorseRacing() {
    hideAllGames();
    document.getElementById('horse-racing').style.display = 'block';
}

function showBlackjack() {
    hideAllGames();
    document.getElementById('blackjack').style.display = 'block';
}

function showSlots() {
    hideAllGames();
    document.getElementById('slots').style.display = 'block';
}

function showCoinFlip() {
    hideAllGames();
    document.getElementById('coin-flip').style.display = 'block';
}

function hideAllGames() {
    document.getElementById('horse-racing').style.display = 'none';
    document.getElementById('blackjack').style.display = 'none';
    document.getElementById('slots').style.display = 'none';
    document.getElementById('coin-flip').style.display = 'none';
}

// Horse Racing Game
function startHorseRacing() {
    const horses = ['Horse 1', 'Horse 2', 'Horse 3', 'Horse 4'];
    const winner = horses[Math.floor(Math.random() * horses.length)];
    document.getElementById('race-result').innerText = `The winner is ${winner}!`;
}

// Blackjack Game (Basic Concept)
function startBlackjack() {
    const playerHand = Math.floor(Math.random() * 21) + 1;
    const dealerHand = Math.floor(Math.random() * 21) + 1;

    let result = '';
    if (playerHand > 21) {
        result = `You went over 21! You lose. Your hand: ${playerHand}, Dealer's hand: ${dealerHand}`;
    } else if (dealerHand > 21) {
        result = `Dealer went over 21! You win. Your hand: ${playerHand}, Dealer's hand: ${dealerHand}`;
    } else if (playerHand > dealerHand) {
        result = `You win! Your hand: ${playerHand}, Dealer's hand: ${dealerHand}`;
    } else if (dealerHand > playerHand) {
        result = `You lose. Your hand: ${playerHand}, Dealer's hand: ${dealerHand}`;
    } else {
        result = `It's a tie! Your hand: ${playerHand}, Dealer's hand: ${dealerHand}`;
    }

    document.getElementById('blackjack-result').innerText = result;
}

// Slots Game (Random result with 3 symbols)
function startSlots() {
    const symbols = ['🍒', '🍋', '🍊', '🍇', '🍉', '🍓'];
    const spinResult = [symbols[Math.floor(Math.random() * symbols.length)],
                        symbols[Math.floor(Math.random() * symbols.length)],
                        symbols[Math.floor(Math.random() * symbols.length)]];

    let resultMessage = `You spun: ${spinResult.join(' | ')}\n`;

    if (spinResult[0] === spinResult[1] && spinResult[1] === spinResult[2]) {
        resultMessage += 'You win!';
    } else {
        resultMessage += 'Try again!';
    }

    document.getElementById('slots-result').innerText = resultMessage;
}

// Coin Flip Game
function flipCoin() {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    document.getElementById('coin-flip-result').innerText = `The result is: ${result}`;
}
