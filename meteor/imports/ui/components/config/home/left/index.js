import {Template} from "meteor/templating";
import "./index.html";
import {DBInterface} from "../../../../../api/database/db_access";
import {NewCompetition} from "../../new_competition_helpers";
import {Athlete} from "../../../../../api/logic/athlete";
import {Log} from "../../../../../api/log";
import {genUUID} from "../../../../../api/crypto/pwdgen";
import {getAccountByPassphrase} from "../../../../../api/account_managment/SessionAccount";
import {getLoginObject} from "../../../../../api/logic/account";

let _deps = new Tracker.Dependency();

let competitions = [];
let editCompetitions = [];

//TODO replace with login view
getAccountByPassphrase('supersecret', function (account) {
    if (account) {
        Meteor.adminAccount = account;
        Meteor.adminLoginObject = getLoginObject(account);
        console.log("Admin logged in");
    } else {
        alert("Wrong admin password");
    }
});


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

Template.home_left.events({
    'click .link-activate_competition': function (event) {
        const name = event.target.closest(".link-activate_competition").dataset.competition_name;

        Meteor.f7.confirm('Nach dem Starten des Wettbewerbs "' + name + '" müssen alle Geräte erneut eine Verbindung zum Server aufbauen. Wollen Sie fortfahren?', 'Wettbewerb starten', function () {
            DBInterface.activateCompetition(Meteor.adminLoginObject, name);
            Meteor.f7.showPreloader('Daten laden...');
            setTimeout(function () {
                location.reload();
            }, 1500);
        });
    },
    'click #link-new_competition': function (event) {
        Session.keys = {};
        Meteor.groups = [];
        let name = "Unbenannt-" + genUUID();
        Meteor.oldName = name;
        NewCompetition.setName(name);
        FlowRouter.go('/config/new');
    },
    'click .link-edit_competition': function (event) {
        Meteor.f7.showPreloader('Daten laden...');

        const name = event.target.closest(".link-edit_competition").dataset.competition_name;
        Session.keys = {};
        Meteor.groups = [];

        Meteor.call('getEditInformation', Meteor.adminLoginObject, name, function (err, data) {
            if (err) {
                console.log(err);
                Meteor.f7.hidePreloader();
                Meteor.f7.alert("Fehler beim Laden der Daten! Bitte wenden sie sich an den Softwarespezialisten ihres Vertrauens.", "Fehler"); //TODO replace error message
            } else {

                NewCompetition.setName(name);
                Meteor.oldName = name;
                NewCompetition.setCompetitionTypeID(data.competitionTypeID);

                const sports = NewCompetition.getSports();
                for (let sportID in sports) {
                    if (data.sportTypes.indexOf(sports[sportID].stID) == -1) {
                        sports[sportID].activated = false;
                    }
                }
                NewCompetition.setSports(sports);

                const log = new Log();
                let groupNames = {};
                let groups = [];

                for (let athlete in data.encryptedAthletes) {
                    let encryptedAthlete = data.encryptedAthletes[athlete];
                    let decryptedAthlete = Athlete.decryptFromDatabase(log, encryptedAthlete, [Meteor.adminAccount], false, false);

                    if (!groupNames.hasOwnProperty(decryptedAthlete.group)) {
                        groupNames[decryptedAthlete.group] = groups.length;
                        groups.push({
                            name: decryptedAthlete.group,
                            athletes: []
                        });
                    }
                    groups[groupNames[decryptedAthlete.group]].athletes.push({
                        firstName: decryptedAthlete.firstName,
                        lastName: decryptedAthlete.lastName,
                        ageGroup: decryptedAthlete.ageGroup,
                        isMale: decryptedAthlete.isMale,
                        handicap: decryptedAthlete.handicap
                    });

                }

                NewCompetition.setGroups(groups);

                console.log(NewCompetition.getGroups());

                Meteor.f7.hidePreloader();
                FlowRouter.go('/config/new');
            }
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