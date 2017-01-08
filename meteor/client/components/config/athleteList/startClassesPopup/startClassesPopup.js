import {selectedAthlete, modifyAthlete} from "../athleteList";

const startClasses = require('../../../../../imports/data/start_classes.json');

Template.startClassesPopup.helpers({
    name: "Klaus Müller"
});

Template.startClassesPopupContent.helpers({
    startClasses: startClasses
});

Template.startClassesPopupContent.events({
    'click .startClassSelect': function (event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        const id = selectedAthlete.get();
        const startClass = event.target.closest("li").dataset.id;

        modifyAthlete(id, function (athlete) {
            athlete.handicap = startClass;
        });

        selectedAthlete.set(undefined);
        Meteor.f7.closeModal(".popup-startclass");
        return false;
    }
});