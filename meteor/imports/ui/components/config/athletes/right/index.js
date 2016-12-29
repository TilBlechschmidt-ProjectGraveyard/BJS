import {Template} from "meteor/templating";
import "./index.html";
import "../../../../../data/start_classes.json";
import {NewCompetition} from "../../new_competition_helpers";

Meteor.groups = NewCompetition.getGroups();

function save() {
    NewCompetition.setGroups(Meteor.groups);
    NewCompetition.selectAthlete(-1);
}

export let athletes_right_onLoad = function () {

    Template.athletes_right.onRendered(function () {
        let selector = document.getElementById("pick-start_class");
        selector.innerHTML = "";
        for (let st_class in NewCompetition.start_classes) {
            selector.innerHTML += "<option>" +
                "(" + NewCompetition.start_classes[st_class].stID + ") " +
                NewCompetition.start_classes[st_class].name + "</option>";
        }
    });

    Template.athletes_right.events({
        'click #link_next'(event, instance) {
            save();
            FlowRouter.go('/config/codes');
        },
        'click #btn-delete-athlete' (event, instance) {
            Meteor.f7.confirm('Sind sie sicher?', "Athlete löschen", function () {
                NewCompetition.selectAthlete(-1);
                Meteor.groups[Meteor._currentGroup].athletes.splice(Meteor._currentAthlete, 1);
                Meteor._athletes_tracker.changed();
            });
        }
    });
};