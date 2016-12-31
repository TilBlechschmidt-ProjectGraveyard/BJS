import {Template} from "meteor/templating";
import "./index.html";
import {NewCompetition} from "../../new_competition_helpers";

Meteor._groups_tracker = new Tracker.Dependency();
Meteor._athletes_tracker = new Tracker.Dependency();

Meteor._currentGroup = -1;
Meteor._currentAthlete = -1;

function save() {
    Meteor._currentAthlete = -1;
    NewCompetition.setGroups(Meteor.groups);
}

Template.athletes_left.helpers({
    groups: function () {
        Meteor._groups_tracker.depend();
        return Meteor.groups;
    }
});

Template.athletes_left.events({
    'click #link_back' (event, instance) {
        save();
        FlowRouter.go('/config/sports');
    },

    'click #btn-new-group' (event, instance) {
        Meteor.f7.prompt('Bitte geben sie den Namen der Gruppe ein.', 'Gruppenname', function (value) {

            if (NewCompetition.groupExists(value)) {
                Meteor.f7.alert('Es gibt bereits eine Gruppe mit dem Namen "' + value + '".', "Gruppenname");
            } else {
                Meteor._currentGroup = Meteor.groups.length;
                Meteor.groups.push({name: value, athletes: []});
                Meteor._groups_tracker.changed();
                Meteor._athletes_tracker.changed();
            }
        });
    },
    'click .link-open-group': function (event) {
        Meteor._currentGroup = event.target.closest(".link-open-group").dataset.group_index;
        Meteor._athletes_tracker.changed();
    },
});