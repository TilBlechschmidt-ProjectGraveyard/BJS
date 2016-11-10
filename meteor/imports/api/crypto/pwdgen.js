function genRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

export {genRandomCode, genRandomString};

let words_de = require('./../../data/words_de.json');

/**
 * Generates a random string.
 * @param {Number} length The length of the random string.
 * @returns {String}
 */
function genRandomString(length) {
    var pass = "";
    for (var i in _.range(length)) {
        pass += genRandomInt(33, 127);
    }
    return pass;
}

/**
 * Generates a random login code.
 * @returns {String}
 */
function genRandomCode() {
    return words_de[genRandomInt(0, words_de.length)] +
        genRandomInt(0, 1000) +
        words_de[genRandomInt(0, words_de.length)];
}