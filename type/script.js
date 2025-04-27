const textToTypeElement = document.getElementById('text-to-type');
const userInput = document.getElementById('user-input');
const timerDisplay = document.getElementById('timer');
const speedDisplay = document.getElementById('speed');
const accuracyDisplay = document.getElementById('accuracy');
const restartButton = document.getElementById('restart-btn');

let timer;
let seconds = 0;
let typedText = '';
let totalWords = 0;
let correctWords = 0;
let isTyping = false;
let originalText = '';

const texts = [
    "the quick brown fox jumps over the lazy dog",
    "oh the misery everybody wants to be my enemy",
    "she said do you love me I tell her only partly",
    "this sample text is sponsored by wavesmiley.com",
    "i got two phones one for the plug and one for the load",
    "whether tis nobler in the mind to suffer the slings and arrows of outrageous fortune",
    "free nvidia geforce now ultraviolet fortnite proxy working february 2023",
    "fuck a matthew crook I could never miss a target",
    "croissant burglar never bluegrass premium gambit folding",
    "dodecahedron mixtape groan fort chicken mountains",
    "who's that? is he some sort of king? no, he's a legend",
    "i've never had dinner with the president",
    "water ice salt aye meep jacket leather coral",
    "you scream I scream we all scream for okay",
    "can I get a rizz and can you make it gyatt forever",
    "soup vacuum insane wily grumbling vampire",
    "habanero world island corn platinum triple zoom pebbles",
    "pineapple backflip front side lefty righty zero forty one",
    "eight seven tricks four troll deer fawn four",
    "nine glue grass ground floor chips man woman horse no",
    "mandy's candies we all love mandy's candies",
    "flop moop jop grimb lich hop eleventyseven fish bart",
    "frimp tomorrow forever popsicle evangelion humanity crystals",
    "instead of drinking imported beers somebody brought a bottle of orphan tears",
    "this mailbox is mine and this triagonal sign",
    "milkyway glaze i am milkyway by playboi milky",
    "limbo by mindcap and more",
    "github lotus flower chinese bottom ninety",
    "i told her i'm big like bieber she ain't believe me",
    "it sounds like a lot of hoopla lemon lime cake"
];

// Randomly select a text
function getRandomText() {
    const randomIndex = Math.floor(Math.random() * texts.length);
    return texts[randomIndex];
}

// Set the text to type
function setTextToType() {
    originalText = getRandomText();
    updateHighlightedText();
}

// Highlight typed words
function updateHighlightedText() {
    const inputWords = typedText.trim().split(/\s+/);
    const textWords = originalText.split(' ');

    const highlighted = textWords.map((word, index) => {
        if (!inputWords[index]) return `<span>${word}</span>`;
        if (inputWords[index] === word) {
            return `<span style="color: #00ff00">${word}</span>`; // green for correct
        } else {
            return `<span style="color: #ff4444">${word}</span>`; // red for wrong
        }
    });

    textToTypeElement.innerHTML = highlighted.join(' ');
}

// Start a new typing test
function startTest() {
    setTextToType();
    userInput.value = '';
    seconds = 0;
    timerDisplay.innerText = seconds;
    speedDisplay.innerText = 0;
    accuracyDisplay.innerText = 100;
    isTyping = false;
    clearInterval(timer);
}

// Calculate accuracy and speed
function countCorrectWords(input, text) {
    const inputWords = input.split(' ');
    const textWords = text.split(' ');
    let correctCount = 0;
    for (let i = 0; i < inputWords.length; i++) {
        if (inputWords[i] === textWords[i]) {
            correctCount++;
        }
    }
    return correctCount;
}

function updateStats() {
    const totalWordsTyped = typedText.trim().split(/\s+/).length;
    correctWords = countCorrectWords(typedText, originalText);

    let speed = 0;
    if (seconds > 0) {
        speed = Math.round((totalWordsTyped / 5) / (seconds / 60));
    }

    const accuracy = totalWordsTyped > 0
        ? Math.round((correctWords / totalWordsTyped) * 100)
        : 100;

    speedDisplay.innerText = speed;
    accuracyDisplay.innerText = accuracy;
}

// Event listener for user input
userInput.addEventListener('input', function() {
    if (!isTyping) {
        startTimer();
        isTyping = true;
    }

    typedText = userInput.value;
    totalWords = typedText.split(' ').length;
    updateStats();
    updateHighlightedText();
});

// Timer function
function startTimer() {
    timer = setInterval(function() {
        seconds++;
        timerDisplay.innerText = seconds;
    }, 1000);
}

// Restart test when the button is clicked
restartButton.addEventListener('click', startTest);

// Initialize the page
startTest();
