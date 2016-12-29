import "./index.html";
import {NewCompetition} from "../../new_competition_helpers";

Meteor.groups = NewCompetition.getGroups();


Template.athletes_middle.helpers({
    "athletes": function () {
        Meteor._athletes_tracker.depend();

        // Page is not ready
        if (!document.getElementById("btn-rename-group")) {
            Meteor._currentGroup = -1;
            return [];
        } else if (Meteor._currentGroup != -1) {
            const group = Meteor.groups[Meteor._currentGroup];
            document.getElementById("btn-rename-group").innerHTML = group.name;
            document.getElementById("btn-rename-group").removeAttribute("disabled");
            document.getElementById("btn-delete-group").removeAttribute("disabled");
            document.getElementById("btn-add-athlete").removeAttribute("disabled");

            return group.athletes;
        } else {
            document.getElementById("btn-rename-group").innerHTML = "Keine Gruppe Ausgewählt";
            document.getElementById("btn-rename-group").disabled = true;
            document.getElementById("btn-delete-group").disabled = true;
            document.getElementById("btn-add-athlete").disabled = true;

            return [];
        }
    }
});

Template.athletes_middle.events({
    'click #btn-rename-group' (event, instance) {
        Meteor.f7.prompt('Bitte geben sie den Namen der Gruppe ein.', 'Gruppen umbenennen', function (value) {

            if (NewCompetition.groupExists(value)) {
                Meteor.f7.alert('Es gibt bereits eine Gruppe mit dem Namen "' + value + '".');
            } else {
                Meteor.groups[Meteor._currentGroup].name = value;
                Meteor._groups_tracker.changed();
                Meteor._athletes_tracker.changed();
            }
        });
    },
    'click #btn-delete-group' (event, instance) {
        Meteor.f7.confirm('Sind sie sicher?', function () {
            Meteor.groups.splice(Meteor._currentGroup, 1);
            Meteor._currentGroup = -1;
            Meteor._groups_tracker.changed();
            Meteor._athletes_tracker.changed();
        });
    },
    'click #btn-add-athlete' (event, instance) {
        Meteor.groups[Meteor._currentGroup].athletes.push({
            firstName: "Unbenannt",
            lastName: "Unbenannt",
            ageGroup: 2000,
            isMale: true,
            handicap: "0",
        });
        Meteor._athletes_tracker.changed();
    },
    'click .link-open-athlete': function (event) {
        NewCompetition.selectAthlete(event.target.closest(".link-open-athlete").dataset.athlete_index);
    }
});