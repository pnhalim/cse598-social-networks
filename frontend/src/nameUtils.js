/**
 * Utility functions for handling user names
 */

/**
 * Extracts the first name from a full name string.
 * If the name contains spaces, returns only the first word.
 * If no name is provided, returns null or a fallback.
 * 
 * @param {string|null|undefined} fullName - The full name string
 * @param {string} fallback - Fallback value if name is empty (default: 'Anonymous')
 * @returns {string} The first name only
 */
export function getFirstName(fullName, fallback = 'Anonymous') {
  if (!fullName || typeof fullName !== 'string') {
    return fallback;
  }
  
  // Trim and split by spaces, take first word
  const trimmed = fullName.trim();
  if (!trimmed) {
    return fallback;
  }
  
  const firstWord = trimmed.split(/\s+/)[0];
  return firstWord || fallback;
}

/**
 * Gets the first character of the first name for avatar initials
 * @param {string|null|undefined} fullName - The full name string
 * @returns {string} Single uppercase character or '?'
 */
export function getInitial(fullName) {
  const firstName = getFirstName(fullName, '');
  return firstName ? firstName.charAt(0).toUpperCase() : '?';
}

