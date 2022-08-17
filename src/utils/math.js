/**
 * Rounds a number (more reliable then Math.round).
 * @param {number} n number to round
 * @param {number} p decimal points
 * @returns {number} rounded number
 */
const round = (n, p = 0) => {
  return Math.round(n * Math.pow(10, p)) / Math.pow(10, p);
}

/**
 * Rounds down a number (more reliable then Math.floor).
 * @param {number} n number to round
 * @param {number} p decimal points
 * @returns {number} rounded number
 */
const floor = (n, p = 0) => {
  return Math.floor(n * Math.pow(10, p)) / Math.pow(10, p);
}

/**
 * Rounds up a number (more reliable then Math.ceil).
 * @param {number} n number to round
 * @param {number} p decimal points
 * @returns {number} rounded number
 */
const ceil = (n, p = 0) => {
  return Math.ceil(n * Math.pow(10, p)) / Math.pow(10, p);
}

module.exports = {
  round,
  ceil,
  floor,
}