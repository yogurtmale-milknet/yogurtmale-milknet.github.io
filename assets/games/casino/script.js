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
    // Get the player's choice
    const playerChoice = document.getElementById('coin-choice').value;
    const outcomes = ['Heads', 'Tails'];
    
    // Randomly determine the coin flip result
    const result = outcomes[Math.floor(Math.random() * outcomes.length)];

    // Display the result
    let resultMessage = `You chose ${playerChoice}. The coin landed on ${result}. `;
    if (playerChoice === result) {
        resultMessage += "Congratulations, you win!";
    } else {
        resultMessage += "Sorry, better luck next time!";
    }

    document.getElementById('coin-flip-result').innerText = resultMessage;
}



// Horse Racing Game
function startHorseRacing() {
    // Get the horse selected by the player
    const playerHorse = document.getElementById('horse-selection').value;
    const horses = ['Horse 1', 'Horse 2', 'Horse 3', 'Horse 4'];
    
    // Simulate the race and randomly choose a winner
    const winner = horses[Math.floor(Math.random() * horses.length)];

    // Display the results
    let resultMessage = `You bet on ${playerHorse}. `;
    if (playerHorse === winner) {
        resultMessage += `Congratulations! ${winner} wins the race!`;
    } else {
        resultMessage += `Sorry, ${winner} wins the race. Better luck next time!`;
    }

    document.getElementById('race-result').innerText = resultMessage;
}
