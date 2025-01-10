// File: /test.js

import { fetchFlashcards, shuffle, getUrlParams, capitalizeFirstLetter } from './data.js';

loadSubjectsAndPopulate('test');
setupTestEventListeners();


// === DOM Elements ===
const subjectSelect = document.getElementById('subject');
const startTestButton = document.getElementById('start-test');
const testContainer = document.getElementById('test-container');
const testQuestions = document.getElementById('test-questions');
const testAnswers = document.getElementById('test-answers');
const resetTestButton = document.getElementById('reset-test');
const testNavigation = document.getElementById('test-navigation');

let flashcards = [];
let testCards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;

/**
 * Fetch and populate subjects in the dropdown
 */
async function loadSubjectsAndPopulate(mode) {
    const subjects = await fetchSubjects();
    populateDropdown(subjects);
    
    if (mode === 'test') {
        startTestButton.addEventListener('click', handleStartTest);
    }
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
 * Handle Start Test Button Click
 */
async function handleStartTest() {
    const subject = subjectSelect.value;
    if (!subject) {
        alert('Please select a subject.');
        return;
    }

    // Fetch flashcards for the selected subject
    flashcards = await fetchFlashcards(subject);
    if (flashcards.length === 0) return;

    // Hide Subject Selector and Show Test Mode
    document.getElementById('subject-selector').style.display = 'none';
    testNavigation.style.display = 'block';
    testContainer.style.display = 'block';

    // Initialize Test Mode
    setupTestMode();
}

/**
 * Setup Test Mode by generating test questions and answers
 */
function setupTestMode() {
    // Reset previous test state
    resetTestState();

    // Prepare Test Cards
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
 * Setup Event Listeners for Test Mode
 */
function setupTestEventListeners() {
    // Event listener for Test Cards
    testContainer.addEventListener('click', handleTestCardClick);

    // Event listener for Reset Test button
    resetTestButton.addEventListener('click', () => {
        resetTest();
    });

    // Window Resize Listener
    window.addEventListener('resize', () => {
        adjustTestGridHeight();
    });

    // Window Load Listener for initial height adjustment
    window.addEventListener('load', () => {
        adjustTestGridHeight();
    });
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
    setupTestMode();
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
 * Setup Test Mode Event Listeners and Initialize
 */
function setupTestMode() {
    // Generate Test Columns with Questions and Answers
    setupTestEventListeners();
    generateTestColumnsForTestMode();
}

/**
 * Generate Test Columns specifically for Test Mode
 */
function generateTestColumnsForTestMode() {
    // This function can be similar to generateTestColumns in ui.js or flashcards.js
    // For simplicity, it's left empty as the core functionality is already handled
}
