// File: /data.js

/**
 * Fetches the list of subjects from subjects.json
 * @returns {Promise<Array>} Array of subject strings
 */
export async function fetchSubjects() {
    try {
        const response = await fetch('./subjects.json');
        if (!response.ok) {
            throw new Error(`Failed to load subjects.json: ${response.status}`);
        }
        const subjects = await response.json();
        return subjects;
    } catch (error) {
        console.error('Error loading subjects:', error);
        alert('Failed to load subjects.');
        return [];
    }
}

/**
 * Fetches flashcards for a specific subject
 * @param {string} subject - The subject identifier
 * @returns {Promise<Array>} Array of flashcard objects
 */
export async function fetchFlashcards(subject) {
    const flashcardUrl = `./flashcards/${subject}.json`;
    try {
        const response = await fetch(flashcardUrl);
        if (!response.ok) {
            throw new Error(`Failed to load flashcards for subject: ${subject}. Status: ${response.status}`);
        }
        const flashcards = await response.json();
        return flashcards;
    } catch (error) {
        console.error('Error loading flashcards:', error);
        alert(`Failed to load flashcards for subject "${subject}". Please check the console for more details.`);
        return [];
    }
}

/**
 * Shuffles an array in place using the Fisher-Yates algorithm
 * @param {Array} array 
 * @returns {Array} The shuffled array
 */
export function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
  
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
  
    return array;
}

/**
 * Parses URL parameters and returns an object of key-value pairs
 * @returns {Object} URL parameters
 */
export function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
    });
    return params;
}

/**
 * Capitalizes the first letter of a given string
 * @param {string} string 
 * @returns {string} Capitalized string
 */
export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
