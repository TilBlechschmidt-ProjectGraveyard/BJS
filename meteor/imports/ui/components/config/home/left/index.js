import {Template} from "meteor/templating";
import "./index.html";
import {DBInterface} from "../../../../../api/database/db_access";
import {NewCompetition, nameExists} from "../../new_competition_helpers";
import {encryptedAthletesToGroups} from "../../../../../api/logic/athlete";
import {AccountManager} from "../../../../../api/account_managment/AccountManager";

let _deps = new Tracker.Dependency();

let competitions = [];
let editCompetitions = [];


//noinspection JSUnusedGlobalSymbols
Template.home_left.helpers({
    competitions: function () {
        _deps.depend();
        return competitions;
    },
    editCompetitions: function () {
        _deps.depend();
        return editCompetitions;
    }
});

//noinspection JSUnusedLocalSymbols
Template.home_left.events({
    'click .link-activate_competition': function (event) {
        const name = event.target.closest(".link-activate_competition").dataset.competition_name;

        Meteor.f7.confirm('Nach dem Starten des Wettbewerbs "' + name + '" müssen alle Geräte erneut eine Verbindung zum Server aufbauen. Wollen Sie fortfahren?', 'Wettbewerb starten', function () {
            Meteor.f7.showPreloader('Daten laden...');
            DBInterface.activateCompetition(AccountManager.getAdminAccount().account, name, function (result) {
                if (!result) {
                    Meteor.f7.alert("Es gab einen Fehler während des Ladens. Melden Sie sich ab und versuchen Sie es bitte erneut.", "Fehler");
                } else {
                    setTimeout(function () {
                        location.reload();
                    }, 1500);
                }
            });
        });
    },
    'click #link-new_competition': function (event) {
        Session.keys = {};
        Meteor.groups = [];
        Meteor.loginGroups = [];
        Meteor.loginStations = [];
        Meteor.loginCustom = [];
        let counter = 1;
        let name = "BJS " + new Date().getFullYear();

        while (nameExists(name)) {
            counter++;
            name = "BJS " + new Date().getFullYear() + " " + counter;
        }

        Meteor.oldName = name;
        NewCompetition.setName(name);
        FlowRouter.go('/config/new');
    },
    'click .link-edit_competition': function (event) {
        Meteor.f7.showPreloader('Daten laden...');

        const name = event.target.closest(".link-edit_competition").dataset.competition_name;
        Session.keys = {};
        Meteor.groups = [];
        Meteor.loginGroups = [];
        Meteor.loginStations = [];
        Meteor.loginCustom = [];

        DBInterface.getEditInformation(AccountManager.getAdminAccount().account, name, function (data) {
            NewCompetition.setName(name);
            Meteor.oldName = name;
            NewCompetition.setCompetitionTypeID(data.competitionTypeID);

            const sports = NewCompetition.getSports();
            for (let sportID in sports) {
                if (!sports.hasOwnProperty(sportID)) continue;
                if (data.sportTypes.indexOf(sports[sportID].stID) == -1) {
                    sports[sportID].activated = false;
                }
            }
            NewCompetition.setSports(sports);

            const groups = encryptedAthletesToGroups(data.encryptedAthletes, [NewCompetition.editModeAccount], false, false);

            NewCompetition.setGroups(groups);

            Meteor.f7.hidePreloader();
            FlowRouter.go('/config/new');
        });
    }
});

Template.home_left.onRendered(function () {
    DBInterface.waitForReady(function () {
        competitions = DBInterface.listCompetitions();
        editCompetitions = DBInterface.listEditCompetitions();
        _deps.changed();
    });
});