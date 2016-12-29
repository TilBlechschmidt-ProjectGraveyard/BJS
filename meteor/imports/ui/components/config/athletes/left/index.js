import {Template} from "meteor/templating";
import "./index.html";
import {NewCompetition} from "../../new_competition_helpers";

let _groups_tracker = new Tracker.Dependency();
Meteor.groups = NewCompetition.getGroups();

function save() {
    NewCompetition.setGroups(Meteor.groups);
}

function groupExists(name) {
    for (let group in Meteor.groups) {
        if (Meteor.groups[group].name === name) return true;
    }
    return false;
}

Template.athletes_left.helpers({
    "groups": function () {
        _groups_tracker.depend();
        return Meteor.groups;
    }
});

Template.athletes_left.events({
    'click #link_back' (event, instance) {
        save();
        FlowRouter.go('/config/sports');
    },

    'click #btn-new-group' (event, instance) {
        Meteor.f7.prompt('Bitte geben sie den Namen der Gruppe ein?', 'Gruppenname', function (value) {

            if (groupExists(value)) {
                Meteor.f7.alert('Es gibt bereits eine Gruppe mit dem Namen "' + value + '".');
            } else {
                Meteor.groups.push({name: value, athletes: []});
                _groups_tracker.changed();
            }
        });
    }
});