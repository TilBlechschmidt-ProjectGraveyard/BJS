import {selectedAthlete, modifyAthlete} from "../dataInterface";
import {editMode} from "../../config";

const startClasses = require('../../../../../imports/data/startClasses.json');

Template.startClassesPopup.helpers({
    name: function () {
        const athlete = selectedAthlete.get();
        if (athlete) return athlete.getFullName();
    }
});

Template.startClassesPopupContent.helpers({
    startClasses: startClasses,
    readOnly: function () {
        return !editMode.get();
    }
});

Template.startClassesPopupContent.events({
    'click .startClassSelect': function (event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        const athlete = selectedAthlete.get();
        if (athlete) {
            const id = selectedAthlete.get().id;
            const startClass = event.target.closest("li").dataset.id;

            modifyAthlete(id, function (athlete) {
                athlete.handicap = startClass;
            });

            selectedAthlete.set(undefined);
            Meteor.f7.closeModal(".popup-startclass");
        }
        return false;
    }
});