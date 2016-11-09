function genRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function genRandomPassword(length) {
    var pass = "";
    for (var i in _.range(length)) {
        var code = genRandomInt(0, 34);
        if (code < 9) {
            pass += String.fromCharCode(49 + code);
        } else {
            pass += String.fromCharCode(56 + code);
        }
    }
    return pass;
}