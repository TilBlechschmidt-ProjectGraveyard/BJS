import { Meteor } from 'meteor/meteor';

import { CompetitionTypes } from './logic/competition_type.js';
import { Person } from './logic/person.js';

Meteor.startup(() => {
  // code to run on server at startup


    tests();
});


function tests() {
    console.log(CompetitionTypes[0].object.getSports());

    var p = new Person('Hans', 'Peter', 16, true, 'Q#z', 'A0');

    console.log(p.checkPerson());
    console.log(p.getFullName());
    console.log(p.getShortName());
}