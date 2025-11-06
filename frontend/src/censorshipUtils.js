/**
 * Content moderation utility using @2toad/profanity library
 * Checks text input for inappropriate content using a comprehensive profanity detection library
 */

import { profanity } from '@2toad/profanity';

/**
 * Check if text contains inappropriate content
 * @param {string} text - Text to check
 * @returns {Object} - { hasInappropriateContent: boolean, matchedWords: string[] }
 */
export function checkCensorship(text) {
  if (!text || typeof text !== 'string') {
    return { hasInappropriateContent: false, matchedWords: [] };
  }

  // Check if text contains profanity
  const hasInappropriateContent = profanity.exists(text);

  // Try to extract matched words by comparing original and censored text
  let matchedWords = [];
  if (hasInappropriateContent) {
    try {
      // Get censored version
      const censoredText = profanity.censor(text);
      
      // Split both texts into words and compare
      // Words that were censored (replaced with asterisks) indicate profanity
      const originalWords = text.split(/\s+/);
      const censoredWords = censoredText.split(/\s+/);
      
      // Find words that were censored (contain asterisks in censored version)
      for (let i = 0; i < Math.min(originalWords.length, censoredWords.length); i++) {
        const origWord = originalWords[i];
        const censWord = censoredWords[i];
        
        if (censWord.includes('*') || origWord.toLowerCase() !== censWord.toLowerCase()) {
          // This word was likely censored
          // Clean the word to get the base form (remove punctuation)
          const cleanWord = origWord.toLowerCase().replace(/[^\w]/g, '');
          if (cleanWord && !matchedWords.includes(cleanWord)) {
            matchedWords.push(cleanWord);
          }
        }
      }
    } catch (error) {
      // If extraction fails, just return empty list
      // The important part (detection) still works
      matchedWords = [];
    }
  }

  return {
    hasInappropriateContent,
    matchedWords
  };
}

/**
 * Validate text input and return error message if inappropriate
 * @param {string} text - Text to validate
 * @param {string} fieldName - Name of the field (for error message)
 * @returns {string|null} - Error message or null if valid
 */
export function validateTextInput(text, fieldName = 'This field') {
  const result = checkCensorship(text);
  if (result.hasInappropriateContent) {
    return `${fieldName} contains inappropriate content. Please use respectful language.`;
  }
  return null;
}

/**
 * Hook-like function to validate on change
 * Can be used in React components
 */
export function useCensorshipCheck() {
  return {
    check: checkCensorship,
    validate: validateTextInput
  };
}

