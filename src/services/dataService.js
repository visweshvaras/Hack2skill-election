const fs = require('fs');

/**
 * Service to handle loading and processing of local data files.
 */

/**
 * Loads data from a file that uses the 'window.KEY = ...' pattern.
 * @param {string} filePath 
 * @param {string} key 
 * @returns {any}
 */
function loadWindowData(filePath, key) {
  try {
    const source = fs.readFileSync(filePath, 'utf8');
    const window = {};
    const loader = new Function('window', `${source}; return window[${JSON.stringify(key)}];`);
    return loader(window);
  } catch (error) {
    console.error(`Error loading window data from ${filePath}:`, error);
    return null;
  }
}

module.exports = { loadWindowData };
