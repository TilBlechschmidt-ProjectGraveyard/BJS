function genRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

export {genRandomCode, genRandomString};

let words_de = require('./../../data/words_de.json');

/**
 * Generates a random string.
 * @param {Number} length - The length of the random string.
 * @returns {String}
 */
function genRandomString(length) {
    let pass = '';
    //noinspection JSUnusedLocalSymbols
    for (let i in _.range(length)) { //TODO remove noinspection
        pass += genRandomInt(33, 127);
    }
    return pass;
}

/**
 * Generates a random table code.
 * @returns {String}
 */
function genRandomCode() {
    //noinspection JSUnresolvedVariable
    return words_de[genRandomInt(0, words_de.length)] +
        genRandomInt(0, 1000) +
        words_de[genRandomInt(0, words_de.length)];
}