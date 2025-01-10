// File: /flashcards.js

import { fetchFlashcards, getUrlParams, capitalizeFirstLetter } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeFlashcards();
    setupEventListeners();
});

// === DOM Elements ===
const flashcardContainer = document.getElementById('flashcard-container');
const flashcard = document.getElementById('flashcard');
const front = document.getElementById('front');
const back = document.getElementById('back');
const prevButton = document.getElementById('prev');
const flipButton = document.getElementById('flip');
const nextButton = document.getElementById('next');
const pageTitle = document.getElementById('page-title');
const controls = document.getElementById('controls');

let flashcards = [];
let currentIndex = 0;
let isAnimating = false; // Flag to prevent overlapping animations
let currentSubject = ""; // Tracks the active subject

/**
 * Initialize Flashcards based on URL parameters or default selection
 */
async function initializeFlashcards() {
    const params = getUrlParams();
    const assignmentId = params['assignmentId'];

    if (assignmentId) {
        currentSubject = assignmentId; // Set the current subject
        flashcards = await fetchFlashcards(currentSubject);
        if (flashcards.length === 0) return;

        // Update the page title
        pageTitle.textContent = `Flashcards - ${capitalizeFirstLetter(currentSubject.replace(/_/g, ' '))}`;
        // Hide controls initially if needed
        controls.style.display = 'flex';
        // Show the first flashcard
        showFlashcard();
    } else {
        alert('No subject specified. Please navigate to flashcards.html with a valid subject.');
    }
}

/**
 * Setup all event listeners for flashcards
 */
function setupEventListeners() {
    prevButton.addEventListener('click', handlePrev);
    nextButton.addEventListener('click', handleNext);
    flipButton.addEventListener('click', handleFlip);

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

    // Handle flip on flashcard click
    flashcard.addEventListener('click', handleFlip);
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
