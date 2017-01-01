function genRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}


let words_de = require('./../../data/words_de.json');


/**
 * Generates a random table code.
 * @returns {String}
 */
export function genRandomCode() {
    //noinspection JSUnresolvedVariable
    return words_de[genRandomInt(0, words_de.length)] +
        genRandomInt(0, 1000) +
        words_de[genRandomInt(0, words_de.length)];
}

/**
 * Creates a random guid
 * @return {string}
 */
export function genUUID() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}