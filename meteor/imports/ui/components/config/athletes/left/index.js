import {Template} from "meteor/templating";
import "./index.html";
import {NewCompetition} from "../../new_competition_helpers";

let _groups_tracker = new Tracker.Dependency();
Meteor.groups = NewCompetition.getGroups();

function save() {
    NewCompetition.setGroups(Meteor.groups);
}

Template.athletes_left.helpers({
    "groups": function () {
        _groups_tracker.depend();
        console.log("UI");
        console.log(Meteor.groups);
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
            Meteor.groups.push({name: value, athletes: []});
            _groups_tracker.changed();
            console.log(Meteor.groups);
        });
    }
});