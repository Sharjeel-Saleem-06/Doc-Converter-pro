/**
 * Simple spell checker utility
 * For production, consider using a library like 'nspell' or API-based solution
 */

// Common misspellings dictionary
const commonMisspellings: Record<string, string> = {
    'teh': 'the',
    'taht': 'that',
    'thier': 'their',
    'recieve': 'receive',
    'occured': 'occurred',
    'untill': 'until',
    'occassion': 'occasion',
    'accomodate': 'accommodate',
    'seperate': 'separate',
    'definately': 'definitely',
    'goverment': 'government',
    'enviroment': 'environment',
    'recomend': 'recommend',
    'beleive': 'believe',
    'wierd': 'weird',
    'recieved': 'received',
    'begining': 'beginning',
    'occuring': 'occurring',
    'writting': 'writing',
    'commited': 'committed',
};

export interface SpellCheckResult {
    word: string;
    suggestions: string[];
    position: number;
}

/**
 * Auto-correct common misspellings
 */
export function autoCorrect(text: string): string {
    let corrected = text;

    // Replace common misspellings (case-insensitive)
    Object.entries(commonMisspellings).forEach(([wrong, correct]) => {
        const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
        corrected = corrected.replace(regex, (match) => {
            // Preserve case
            if (match[0] === match[0].toUpperCase()) {
                return correct.charAt(0).toUpperCase() + correct.slice(1);
            }
            return correct;
        });
    });

    return corrected;
}

/**
 * Check spelling and return suggestions
 */
export function checkSpelling(text: string): SpellCheckResult[] {
    const results: SpellCheckResult[] = [];
    const words = text.match(/\b\w+\b/g) || [];

    words.forEach((word, index) => {
        const lowerWord = word.toLowerCase();

        // Check if word is in misspellings dictionary
        if (commonMisspellings[lowerWord]) {
            results.push({
                word,
                suggestions: [commonMisspellings[lowerWord]],
                position: text.indexOf(word),
            });
        }
    });

    return results;
}

/**
 * Get word suggestions (using Levenshtein distance)
 */
export function getWordSuggestions(word: string, dictionary: string[] = Object.values(commonMisspellings)): string[] {
    const lowerWord = word.toLowerCase();
    const suggestions: Array<{ word: string; distance: number }> = [];

    dictionary.forEach(dictWord => {
        const distance = levenshteinDistance(lowerWord, dictWord.toLowerCase());
        if (distance <= 2) {
            suggestions.push({ word: dictWord, distance });
        }
    });

    return suggestions
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5)
        .map(s => s.word);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

/**
 * Capitalize first letter of sentences
 */
export function autoCapitalize(text: string): string {
    return text.replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => {
        return p1 + p2.toUpperCase();
    });
}

/**
 * Fix common punctuation issues
 */
export function fixPunctuation(text: string): string {
    let fixed = text;

    // Fix double spaces
    fixed = fixed.replace(/\s{2,}/g, ' ');

    // Fix space before punctuation
    fixed = fixed.replace(/\s+([.,;:!?])/g, '$1');

    // Add space after punctuation if missing
    fixed = fixed.replace(/([.,;:!?])([A-Za-z])/g, '$1 $2');

    // Fix quotes
    fixed = fixed.replace(/\s+"/g, ' "');
    fixed = fixed.replace(/"\s+/g, '" ');

    return fixed;
}
