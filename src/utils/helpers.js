/**
 * @fileoverview Utility functions for data processing and sanitization.
 */

/**
 * Strips HTML tags from a string and normalizes whitespace.
 * @param {string} html - The raw HTML string.
 * @returns {string} The sanitized text.
 */
function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extracts the original URL from a Google News redirection link.
 * @param {string} link - The Google News RSS link.
 * @returns {string} The decoded direct URL.
 */
function decodeGoogleNewsLink(link) {
  try {
    const parsed = new URL(link);
    const direct = parsed.searchParams.get('url');
    return direct || link;
  } catch (error) {
    return link;
  }
}

/**
 * Normalizes a string for use as an object key.
 * @param {string} value - The raw string.
 * @returns {string} The normalized key.
 */
function normalizeHeaderKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Clamps a number between a minimum and maximum value.
 * @param {number} num 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

module.exports = {
  stripHtml,
  decodeGoogleNewsLink,
  normalizeHeaderKey,
  clamp
};
