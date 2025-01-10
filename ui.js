// File: /ui.js

import { fetchSubjects, fetchFlashcards, shuffle, getUrlParams, capitalizeFirstLetter } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// === DOM Elements ===
const subjectSelect = document.getElementById('subject');
const startButton = document.getElementById('start');
const flashcardContainer = document.getElementById('flashcard-container');
const flashcard = document.getElementById('flashcard');
const front = document.getElementById('front');
const back = document.getElementById('back');
const prevButton = document.getElementById('prev');
const flipButton = document.getElementById('flip');
const nextButton = document.getElementById('next');
const subjectSelector = document.getElementById('subject-selector');
const pageTitle = document.getElementById('page-title');
const controls = document.getElementById('controls'); // Reference to controls
const modeSelection = document.getElementById('mode-selection'); // Mode Selection Section
const learnModeButton = document.getElementById('learn-mode');
const testModeButton = document.getElementById('test-mode');
const testContainer = document.getElementById('test-container');
const testQuestions = document.getElementById('test-questions');
const testAnswers = document.getElementById('test-answers');
const resetTestButton = document.getElementById('reset-test');

let flashcards = [];
let currentIndex = 0;
let isAnimating = false; // Flag to prevent overlapping animations

// Variables for Test Mode
let testCards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;

let currentSubject = ""; // Tracks the active subject

/**
 * Fetch and populate subjects in the dropdown
 */
async function loadSubjectsAndPopulate() {
    const subjects = await fetchSubjects();
    populateDropdown(subjects);
}

/**
 * Populate the subject dropdown with fetched subjects
 * @param {Array} subjects - Array of subject names
 */
function populateDropdown(subjects) {
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = capitalizeFirstLetter(subject.replace(/_/g, ' '));
        subjectSelect.appendChild(option);
    });
}

/**
 * Initialize the app based on URL parameters
 */
async function initializeApp() {
    const params = getUrlParams();
    const assignmentId = params['assignmentId'];

    if (assignmentId) {
        currentSubject = assignmentId; // Set the current subject
        flashcards = await fetchFlashcards(currentSubject);
        if (flashcards.length === 0) return;

        // Update the page title
        pageTitle.textContent = `Flashcards - ${capitalizeFirstLetter(currentSubject.replace(/_/g, ' '))}`;
        // Hide the subject selector
        subjectSelector.style.display = 'none';
        // Show mode selection
        modeSelection.style.display = 'flex';
    } else {
        // No assignmentId, load subjects for selection
        await loadSubjectsAndPopulate();
        // Show the subject selector
        subjectSelector.style.display = 'block';
    }
}

/**
 * Initialize Test Mode
 */
async function initializeTestMode() {
    // Reset previous test state
    resetTestState();

    // Hide Learn Mode elements
    flashcardContainer.style.display = 'none';
    controls.style.display = 'none';
    
    // Show Test Mode elements
    testContainer.style.display = 'block';
    modeSelection.style.display = 'none';
    
    // Add 'test-mode' class to the container for expanded width
    document.querySelector('.container').classList.add('test-mode');
    
    // Prepare Test Cards
    testCards = [];
    const totalQuestions = 10;
    const matchingPairs = 6;
    const additionalFronts = 4;

    // Shuffle flashcards to ensure randomness
    const shuffledFlashcards = shuffle([...flashcards]);

    // Select matching pairs
    const selectedMatchingFlashcards = shuffledFlashcards.slice(0, matchingPairs);

    // Select additional fronts without matching backs
    const selectedAdditionalFlashcards = shuffledFlashcards.slice(matchingPairs, matchingPairs + additionalFronts);

    // Create question and answer arrays
    let questions = [];
    let answers = [];

    selectedMatchingFlashcards.forEach((card, index) => {
        questions.push({
            id: `front-${index}`,
            content: card.question,
            type: 'question'
        });
        answers.push({
            id: `back-${index}`,
            content: card.answer.replace(/\n/g, '<br>'),
            type: 'answer',
            matchId: `front-${index}`
        });
    });

    // Add additional fronts (without backs)
    selectedAdditionalFlashcards.forEach((card, index) => {
        questions.push({
            id: `front-extra-${index}`,
            content: card.question,
            type: 'question'
        });
        // No corresponding answer is added
    });

    // Shuffle questions and answers independently
    const shuffledQuestions = shuffle(questions);
    const shuffledAnswers = shuffle(answers);

    // Generate the questions and answers
    generateTestColumns(shuffledQuestions, shuffledAnswers);
    adjustTestGridHeight(); // Adjust height on initialization
}

/**
 * Generate Test Columns with Questions and Answers
 * @param {Array} shuffledQuestions 
 * @param {Array} shuffledAnswers 
 */
function generateTestColumns(shuffledQuestions, shuffledAnswers) {
    // Clear existing content
    testQuestions.innerHTML = '<h2>Questions</h2><p>Select an answer to match with the corresponding question.</p>';
    testAnswers.innerHTML = '<h2>Answers</h2><p>Select a question to match with the selected answer.</p>';

    shuffledQuestions.forEach(card => {
        const cardElement = createTestCard(card);
        testQuestions.appendChild(cardElement);
    });

    shuffledAnswers.forEach(card => {
        const cardElement = createTestCard(card);
        testAnswers.appendChild(cardElement);
    });
}

/**
 * Create a Test Card Element
 * @param {Object} card 
 * @returns {HTMLElement}
 */
function createTestCard(card) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('test-card');
    cardElement.dataset.id = card.id;
    cardElement.dataset.matchId = card.matchId || '';
    cardElement.dataset.type = card.type;
    cardElement.innerHTML = card.content; // Display content directly
    return cardElement;
}

/**
 * Handle Card Click in Test Mode
 * @param {Event} e 
 */
function handleTestCardClick(e) {
    const clickedCard = e.target.closest('.test-card');
    if (!clickedCard || lockBoard || clickedCard.classList.contains('correct') || clickedCard.classList.contains('no-match')) return;

    // Deselect if the same card is clicked again
    if (clickedCard.classList.contains('selected')) {
        clickedCard.classList.remove('selected');
        if (clickedCard.dataset.type === 'question') {
            firstCard = null;
        } else if (clickedCard.dataset.type === 'answer') {
            secondCard = null;
        }
        return;
    }

    // Select the card
    clickedCard.classList.add('selected');

    if (clickedCard.dataset.type === 'question') {
        if (firstCard) {
            // Already a question selected, do not allow selecting another question
            alert('You have already selected a question. Please select an answer.');
            clickedCard.classList.remove('selected');
            return;
        }
        firstCard = clickedCard;
    } else if (clickedCard.dataset.type === 'answer') {
        if (secondCard) {
            // Already an answer selected, do not allow selecting another answer
            alert('You have already selected an answer. Please select a question.');
            clickedCard.classList.remove('selected');
            return;
        }
        secondCard = clickedCard;
    }

    // If both cards are selected, check for a match
    if (firstCard && secondCard) {
        lockBoard = true;

        const isMatch = firstCard.dataset.id === secondCard.dataset.matchId || secondCard.dataset.id === firstCard.dataset.matchId;

        if (isMatch) {
            // Correct match: remove both cards
            firstCard.classList.add('correct');
            secondCard.classList.add('correct');

            // Optionally, you can add a fade-out animation before removing
            setTimeout(() => {
                firstCard.remove();
                secondCard.remove();
                resetSelection();
                checkTestCompletion();
            }, 500); // Adjust delay as needed
        } else {
            // Incorrect match
            firstCard.classList.add('incorrect');
            secondCard.classList.add('incorrect');

            setTimeout(() => {
                firstCard.classList.remove('incorrect', 'selected');
                secondCard.classList.remove('incorrect', 'selected');
                resetSelection();
                lockBoard = false;
            }, 500); // 0.5 second delay for animation
        }
    }
}

/**
 * Reset Selection Variables
 */
function resetSelection() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
}

/**
 * Check if Test is Completed
 */
function checkTestCompletion() {
    const remainingCards = testContainer.querySelectorAll('.test-card:not(.correct)');
    if (remainingCards.length === 0) {
        alert('Congratulations! You have matched all the cards.');
    }
}

/**
 * Reset Test Mode
 */
function resetTest() {
    resetTestState();
    initializeTestMode();
    
    // Remove 'test-mode' class when resetting
    document.querySelector('.container').classList.remove('test-mode');
}

/**
 * Reset Test State
 */
function resetTestState() {
    testCards = [];
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    testQuestions.innerHTML = '<h2>Questions</h2><p>Select an answer to match with the corresponding question.</p>';
    testAnswers.innerHTML = '<h2>Answers</h2><p>Select a question to match with the selected answer.</p>';
}

/**
 * Adjust Test Grid Height Dynamically
 */
function adjustTestGridHeight() {
    const headerHeight = pageTitle.offsetHeight;
    const modeSelectionHeightValue = modeSelection.offsetHeight || 0;
    const controlsHeightValue = controls.offsetHeight || 0;
    const resetButtonHeightValue = resetTestButton.offsetHeight || 0;
    const otherHeights = headerHeight + modeSelectionHeightValue + controlsHeightValue + resetButtonHeightValue + 100; // 100px buffer
    const newHeight = window.innerHeight - otherHeights;
    testContainer.style.height = `${newHeight}px`;

    // Additionally, set the height of the test-layout to fit within the test-container
    const testLayout = document.querySelector('.test-layout');
    if (testLayout) {
        testLayout.style.height = `100%`;
    }
}

/**
 * Display the current flashcard without animation
 */
function showFlashcard() {
    const card = flashcards[currentIndex];
    front.innerHTML = card.question;
    back.innerHTML = card.answer.replace(/\n/g, '<br>');
    flashcard.classList.remove('flipped');
    adjustFlashcardHeight();
}

/**
 * Display the current flashcard with animation based on direction
 * @param {string} direction - 'next' or 'prev'
 */
function displayFlashcardWithAnimation(direction) {
    if (isAnimating) return;
    isAnimating = true;

    if (direction === 'next') {
        flashcard.classList.add('slide-out-left');
    } else if (direction === 'prev') {
        flashcard.classList.add('slide-out-right');
    }

    flashcard.addEventListener('animationend', handleAnimationEnd);

    function handleAnimationEnd() {
        flashcard.removeEventListener('animationend', handleAnimationEnd);
        flashcard.classList.remove(direction === 'next' ? 'slide-out-left' : 'slide-out-right');

        // Update index
        if (direction === 'next') {
            currentIndex++;
        } else if (direction === 'prev') {
            currentIndex--;
        }

        // Update content
        const card = flashcards[currentIndex];
        front.innerHTML = card.question;
        back.innerHTML = card.answer.replace(/\n/g, '<br>');
        flashcard.classList.remove('flipped');

        // Add slide-in animation
        if (direction === 'next') {
            flashcard.classList.add('slide-in-right');
        } else if (direction === 'prev') {
            flashcard.classList.add('slide-in-left');
        }

        flashcard.addEventListener('animationend', () => {
            flashcard.classList.remove(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
            isAnimating = false;
            adjustFlashcardHeight();
        }, { once: true });
    }
}

/**
 * Display the current flashcard
 */
function displayFlashcard() {
    showFlashcard();
}

/**
 * Adjust the flashcard container's height based on the visible content
 */
function adjustFlashcardHeight() {
    // Temporarily reset the height to get the natural height
    flashcardContainer.style.height = 'auto';

    // Determine which side is currently visible
    const isFlipped = flashcard.classList.contains('flipped');

    // Get the height of the visible side
    const visibleSide = isFlipped ? back : front;
    const newHeight = visibleSide.scrollHeight + 40; // Adding some padding

    // Set the container height with a smooth transition
    flashcardContainer.style.height = `${newHeight}px`;
}

/**
 * Initialize the application
 */
async function initializeApp() {
    const params = getUrlParams();
    const assignmentId = params['assignmentId'];

    if (assignmentId) {
        currentSubject = assignmentId; // Set the current subject
        flashcards = await fetchFlashcards(currentSubject);
        if (flashcards.length === 0) return;

        // Update the page title
        pageTitle.textContent = `Flashcards - ${capitalizeFirstLetter(currentSubject.replace(/_/g, ' '))}`;
        // Hide the subject selector
        subjectSelector.style.display = 'none';
        // Show mode selection
        modeSelection.style.display = 'flex';
    } else {
        // No assignmentId, load subjects for selection
        await loadSubjectsAndPopulate();
        // Show the subject selector
        subjectSelector.style.display = 'block';
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Event listener for the Start button
    startButton.addEventListener('click', handleStart);

    // Event listener for the Learn mode button
    learnModeButton.addEventListener('click', handleLearnMode);

    // Event listener for the Test mode button
    testModeButton.addEventListener('click', handleTestMode);

    // Event listener for the Reset Test button
    resetTestButton.addEventListener('click', () => {
        resetTest();
    });

    // Event listener for the Flip button
    flipButton.addEventListener('click', () => {
        if (isAnimating) return; // Prevent flipping during animation
        flashcard.classList.toggle('flipped');
        adjustFlashcardHeight();
    });

    // Event listener for the Next button
    nextButton.addEventListener('click', () => {
        if (isAnimating) return;
        if (currentIndex < flashcards.length - 1) {
            displayFlashcardWithAnimation('next');
        } else {
            alert('This is the last flashcard.');
        }
    });

    // Event listener for the Previous button
    prevButton.addEventListener('click', () => {
        if (isAnimating) return;
        if (currentIndex > 0) {
            displayFlashcardWithAnimation('prev');
        } else {
            alert('This is the first flashcard.');
        }
    });

    // Keyboard Navigation
    document.addEventListener('keydown', (event) => {
        if (isAnimating) return; // Prevent actions during animation
        switch(event.key) {
            case 'ArrowLeft':
                prevButton.click();
                break;
            case 'ArrowRight':
                nextButton.click();
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                flipButton.click();
                break;
            default:
                break;
        }
    });

    // Test Columns Event Listener
    testContainer.addEventListener('click', handleTestCardClick);

    // Window Resize Listener
    window.addEventListener('resize', () => {
        adjustFlashcardHeight();
        adjustTestGridHeight();
    });

    // Window Load Listener for initial height adjustment
    window.addEventListener('load', () => {
        adjustTestGridHeight();
    });
}

/**
 * Handle Learn Mode Button Click
 */
function handleLearnMode() {
    if (!currentSubject) {
        alert('No subject selected.');
        return;
    }

    // Show Learn Mode elements
    flashcardContainer.style.display = 'block';
    controls.style.display = 'flex';
    testContainer.style.display = 'none';
    modeSelection.style.display = 'none';
    displayFlashcard();
    
    // Remove 'test-mode' class in case it's present
    document.querySelector('.container').classList.remove('test-mode');
}

/**
 * Handle Test Mode Button Click
 */
function handleTestMode() {
    if (!currentSubject) {
        alert('No subject selected.');
        return;
    }

    // Initialize Test Mode
    initializeTestMode();
}

/**
 * Handle Start Button Click
 */
async function handleStart() {
    const subject = subjectSelect.value;
    if (!subject) {
        alert('Please select a subject.');
        return;
    }

    currentSubject = subject; // Set the current subject based on user selection

    // Fetch flashcards if not already loaded
    flashcards = await fetchFlashcards(currentSubject);
    if (flashcards.length === 0) return;

    // Hide the subject selector
    subjectSelector.style.display = 'none';
    // Show mode selection
    modeSelection.style.display = 'flex';
}

/**
 * Reset Test Mode
 */
function resetTest() {
    resetTestState();
    initializeTestMode();
    
    // Remove 'test-mode' class when resetting
    document.querySelector('.container').classList.remove('test-mode');
}

/**
 * Reset Test State
 */
function resetTestState() {
    testCards = [];
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    testQuestions.innerHTML = '<h2>Questions</h2><p>Select an answer to match with the corresponding question.</p>';
    testAnswers.innerHTML = '<h2>Answers</h2><p>Select a question to match with the selected answer.</p>';
}

/**
 * Adjust Test Grid Height Dynamically
 */
function adjustTestGridHeight() {
    const headerHeight = pageTitle.offsetHeight;
    const modeSelectionHeightValue = modeSelection.offsetHeight || 0;
    const controlsHeightValue = controls.offsetHeight || 0;
    const resetButtonHeightValue = resetTestButton.offsetHeight || 0;
    const otherHeights = headerHeight + modeSelectionHeightValue + controlsHeightValue + resetButtonHeightValue + 100; // 100px buffer
    const newHeight = window.innerHeight - otherHeights;
    testContainer.style.height = `${newHeight}px`;

    // Additionally, set the height of the test-layout to fit within the test-container
    const testLayout = document.querySelector('.test-layout');
    if (testLayout) {
        testLayout.style.height = `100%`;
    }
}
