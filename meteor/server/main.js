import { Meteor } from 'meteor/meteor';

import { CompetitionTypes } from './logic/competition_type.js';
import { Athlete } from './logic/athlete.js';

Meteor.startup(() => {
  // code to run on server at startup


    tests();
});


function tests() {
    console.log(CompetitionTypes[0].object.getSports());

    var p = new Athlete('Hans', 'Peter', 16, true, 'Q#z', 'A0');

    console.log(p.checkPerson());
    console.log(p.getFullName());
    console.log(p.getShortName());

    for (var n in _.range(10)) {
        console.log(getRandomPassword(100))
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPassword(length) {
    var pass = "";
    for (var i in _.range(length)) {
        var code = getRandomInt(0, 34);
        if (code < 9) {
            pass += String.fromCharCode(49 + code);
        } else {
            pass += String.fromCharCode(56 + code);
        }
    }
    return pass;
}