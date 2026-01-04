
/**
 * Generates a random string of text based on allowed keys.
 * @param {string[]} keys - Array of allowed characters
 * @param {number} length - Number of words to generate
 * @returns {string} Generated text
 */
export const generateLessonText = (keys, wordCount = 20) => {
    if (!keys || keys.length === 0) return "";

    const words = [];

    for (let i = 0; i < wordCount; i++) {
        // Generate a word of random length between 2 and 7
        const wordLength = Math.floor(Math.random() * 6) + 2;
        let word = "";
        for (let j = 0; j < wordLength; j++) {
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            word += randomKey;
        }
        words.push(word);
    }

    return words.join(" ");
};
