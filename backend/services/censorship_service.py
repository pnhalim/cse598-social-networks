"""
Content moderation service for backend using better-profanity library
Checks text input for inappropriate content using a comprehensive profanity detection library
"""

import re
from typing import Dict, Tuple
from better_profanity import profanity

def check_censorship(text: str) -> Dict[str, any]:
    """
    Check if text contains inappropriate content
    
    Args:
        text: Text to check
        
    Returns:
        Dictionary with 'has_inappropriate_content' (bool) and 'matched_words' (list)
    """
    if not text or not isinstance(text, str):
        return {'has_inappropriate_content': False, 'matched_words': []}
    
    # Check if text contains profanity
    has_inappropriate_content = profanity.contains_profanity(text)
    
    # Try to extract matched words by comparing original and censored text
    matched_words = []
    if has_inappropriate_content:
        try:
            # Get censored version
            censored_text = profanity.censor(text)
            
            # Split both texts into words and compare
            # Words that were censored (replaced with asterisks) indicate profanity
            original_words = text.split()
            censored_words = censored_text.split()
            
            # Find words that were censored (contain asterisks in censored version)
            for orig_word, cens_word in zip(original_words, censored_words):
                if '*' in cens_word or orig_word.lower() != cens_word.lower():
                    # This word was likely censored
                    # Clean the word to get the base form (remove punctuation)
                    clean_word = re.sub(r'[^\w]', '', orig_word.lower())
                    if clean_word and clean_word not in matched_words:
                        matched_words.append(clean_word)
        except Exception:
            # If extraction fails, just return empty list
            # The important part (detection) still works
            matched_words = []
    
    return {
        'has_inappropriate_content': has_inappropriate_content,
        'matched_words': matched_words
    }

def validate_text_input(text: str, field_name: str = "This field") -> Tuple[bool, str]:
    """
    Validate text input and return error message if inappropriate
    
    Args:
        text: Text to validate
        field_name: Name of the field (for error message)
        
    Returns:
        Tuple of (is_valid: bool, error_message: str)
    """
    result = check_censorship(text)
    if result['has_inappropriate_content']:
        error_msg = f"{field_name} contains inappropriate content. Please use respectful language."
        return False, error_msg
    return True, None

