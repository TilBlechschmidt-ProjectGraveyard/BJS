import {Template} from "meteor/templating";
import "./index.html";
import {COMPETITION_TYPES} from "../../../../../api/logic/competition_type";
import {NewCompetition, nameExists} from "../../new_competition_helpers";
import {DBInterface} from "../../../../../api/database/db_access";


function save() {
    const newName = document.getElementById('text-comp_name').value;

    if (nameExists(newName) && newName != Meteor.oldName) {
        Meteor.f7.alert("Es gibt bereits einen Wettbewerb mit dem gewählten Namen.", "Name");
        return false;
    } else {
        const newCompetitionID = document.getElementById("pick-comp_type").selectedIndex;
        if (NewCompetition.getCompetitionTypeID() != newCompetitionID) {
            NewCompetition.setCompetitionTypeID(newCompetitionID);
        }
        NewCompetition.setName(newName);
        return true;
    }
}

Template.new_competition_main.onRendered(function () {
    let selector = document.getElementById("pick-comp_type");
    selector.innerHTML = "";

    for (let competition_type in COMPETITION_TYPES) {
        selector.innerHTML += "<option>" + COMPETITION_TYPES[competition_type].object.getInformation().name + "</option>";
    }

    document.getElementById("pick-comp_type").selectedIndex = NewCompetition.getCompetitionTypeID();
    document.getElementById('text-comp_name').value = NewCompetition.getName();
    document.getElementById('text-comp_name').value = NewCompetition.getName();
});

Template.new_competition_main.events({
    'click #link_back' (event, instance) {
        Meteor.f7.modal({
            title: 'Speichern',
            text: 'Wollen Sie alle Änderungen speichern',
            verticalButtons: true,
            buttons: [
                {
                    text: 'Ja',
                    onClick: function () {
                        if (save()) {
                            NewCompetition.save(function (result) {
                                if (result) FlowRouter.go('/config');
                            });
                        }
                    }
                },
                {
                    text: 'Nein',
                    onClick: function () {
                        FlowRouter.go('/config');
                    }
                },
                {
                    text: 'Abbrechen',
                    onClick: function () {
                    }
                },
            ]
        });
    },
    'click #link_next' (event, instance) {
        if (save()) FlowRouter.go('/config/sports');
    },
    'click #link_save' (event, instance) {
        Meteor.f7.confirm('Wollen Sie alle Änderungen speichern?', 'Speichern?', function () {
            save();
            NewCompetition.save();
        });
    },
    'click #btn-remove-competition' (event, instance) {
        Meteor.f7.confirm('Wollen Sie den Wettkampf wirklich löschen?', 'Löschen?', function () {
            DBInterface.removeCompetition(Meteor.adminLoginObject, Meteor.oldName, function (result) { //use old name. The name saved in NewCompetition may be changed already.
                if (!result) {
                    Meteor.f7.alert("Es gab einen Fehler während des Löschens. Melden Sie sich ab und versuchen Sie es bitte erneut.");
                    if (typeof callback === 'function') callback(false);
                } else {
                    FlowRouter.go('/config');
                }
            });
        });
    }
});