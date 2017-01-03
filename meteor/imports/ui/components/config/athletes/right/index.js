import {Template} from "meteor/templating";
import "./index.html";
import "../../../../../data/start_classes.json";
import {NewCompetition} from "../../new_competition_helpers";

Meteor.groups = NewCompetition.getGroups();

function save() {
    Meteor._currentAthlete = -1;
    NewCompetition.setGroups(Meteor.groups);
}

export let athletes_right_onLoad = function () {

    Template.athletes_right.onRendered(function () {
        let selector = document.getElementById("pick-start_class");
        selector.innerHTML = "";
        for (let st_class in NewCompetition.start_classes) {
            if (!NewCompetition.start_classes.hasOwnProperty(st_class)) continue;
            selector.innerHTML += "<option>" +
                "(" + NewCompetition.start_classes[st_class].stID + ") " +
                NewCompetition.start_classes[st_class].name + "</option>";
        }
    });

    //noinspection JSUnusedLocalSymbols
    Template.athletes_right.events({
        'click #link_next'(event, instance) {
            save();
            FlowRouter.go('/config/codes');
        },
        'click #btn-delete-athlete' (event, instance) {
            Meteor.f7.confirm('Sind sie sicher?', "Athlete löschen", function () {
                Meteor._currentAthlete = -1;
                Meteor.groups[Meteor._currentGroup].athletes.splice(Meteor._currentAthlete, 1);
                Meteor._athletes_tracker.changed();
            });
        },
        'click #link_save' (event, instance) {
            Meteor.f7.confirm('Wollen Sie alle Änderungen speichern?', 'Speichern?', function () {
                NewCompetition.setGroups(Meteor.groups);
                NewCompetition.save();
            });
        },
        'change .athlete-input' (event, instance) {
            NewCompetition.selectAthlete(Meteor._currentAthlete);
            Meteor._athletes_tracker.changed();
        },
        'input .athlete-input' (event, instance) {
            NewCompetition.selectAthlete(Meteor._currentAthlete);
            Meteor._athletes_tracker.changed();
        },
        'click #btn-add-athlete2' (event, instance) {
            const currentAthlete = Meteor.groups[Meteor._currentGroup].athletes[Meteor._currentAthlete];
            Meteor.groups[Meteor._currentGroup].athletes.push({
                firstName: currentAthlete.firstName,
                lastName: currentAthlete.lastName,
                ageGroup: currentAthlete.ageGroup,
                isMale: currentAthlete.isMale,
                handicap: currentAthlete.handicap,
            });
            Meteor._athletes_tracker.changed();
            NewCompetition.selectAthlete(Meteor.groups[Meteor._currentGroup].athletes.length - 1);
        }
    });
};