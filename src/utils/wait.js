/**
 * Waits (via setTimeout) for given number of milliseconds. Passing 0 or nothing will just throw it to the end of event loop queue.
 * @param {number} ms milliseconds
 */
const wait = function (ms = 0) {
  return new Promise((res, rej) => {
      try {
          setTimeout(() => {
              res();
          }, ms);
      } catch (e) {
          rej(e);
      }
  });
}

module.exports = wait;