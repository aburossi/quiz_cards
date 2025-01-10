// File: /flashcards.js

import { fetchFlashcards, shuffle, getUrlParams, capitalizeFirstLetter } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    loadSubjectsAndPopulate('flashcards');
    setupFlashcardEventListeners();
});

// === DOM Elements ===
const subjectSelect = document.getElementById('subject');
const startFlashcardsButton = document.getElementById('start-flashcards');
const flashcardContainer = document.getElementById('flashcard-container');
const flashcard = document.getElementById('flashcard');
const front = document.getElementById('front');
const back = document.getElementById('back');
const prevButton = document.getElementById('prev');
const flipButton = document.getElementById('flip');
const nextButton = document.getElementById('next');
const flashcardsNavigation = document.getElementById('flashcards-navigation');

let flashcards = [];
let currentIndex = 0;
let isAnimating = false; // Flag to prevent overlapping animations

/**
 * Fetch and populate subjects in the dropdown
 */
async function loadSubjectsAndPopulate(mode) {
    const subjects = await fetchSubjects();
    populateDropdown(subjects);
    
    if (mode === 'flashcards') {
        startFlashcardsButton.addEventListener('click', handleStartFlashcards);
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
 * Handle Start Flashcards Button Click
 */
async function handleStartFlashcards() {
    const subject = subjectSelect.value;
    if (!subject) {
        alert('Please select a subject.');
        return;
    }

    // Fetch flashcards for the selected subject
    flashcards = await fetchFlashcards(subject);
    if (flashcards.length === 0) return;

    // Hide Subject Selector and Show Flashcards
    document.getElementById('subject-selector').style.display = 'none';
    flashcardsNavigation.style.display = 'block';
    flashcardContainer.style.display = 'block';
    document.getElementById('controls').style.display = 'flex';

    // Initialize Flashcards
    currentIndex = 0;
    showFlashcard();
}

/**
 * Setup Event Listeners for Flashcards
 */
function setupFlashcardEventListeners() {
    prevButton.addEventListener('click', handlePrev);
    nextButton.addEventListener('click', handleNext);
    flipButton.addEventListener('click', handleFlip);
    flashcard.addEventListener('click', handleFlip);

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
}

/**
 * Display the current flashcard without animation
 */
function showFlashcard() {
    if (flashcards.length === 0) return;
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
 * Handle Flip Button Click
 */
function handleFlip() {
    if (isAnimating) return; // Prevent flipping during animation
    flashcard.classList.toggle('flipped');
    adjustFlashcardHeight();
}

/**
 * Handle Next Button Click
 */
function handleNext() {
    if (isAnimating) return;
    if (currentIndex < flashcards.length - 1) {
        displayFlashcardWithAnimation('next');
    } else {
        alert('This is the last flashcard.');
    }
}

/**
 * Handle Previous Button Click
 */
function handlePrev() {
    if (isAnimating) return;
    if (currentIndex > 0) {
        displayFlashcardWithAnimation('prev');
    } else {
        alert('This is the first flashcard.');
    }
}
