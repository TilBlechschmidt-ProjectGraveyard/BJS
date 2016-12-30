import {Template} from "meteor/templating";
import "./index.html";
import "../../../layouts/views.css";
import {NewCompetition} from "../new_competition_helpers";
import {genRandomCode} from "../../../../api/crypto/pwdgen";
import {Account} from "../../../../api/logic/account";
import {Crypto} from "../../../../api/crypto/crypto";

let loginStations = [];
let loginGroups = [];

let _login_tracker = new Tracker.Dependency();

Template.codes.helpers({
    login_stations: function () {
        _login_tracker.depend();
        return loginStations;
    },
    login_groups: function () {
        _login_tracker.depend();
        return loginGroups;
    }
});

Template.codes.events({
    'click #link_back' (event,instance) {
        loginStations = [];
        loginGroups = [];
        FlowRouter.go('/config/athletes');
    },
    'click #link_start' (event, instance) {
        if (loginGroups.length != Meteor.groups.length) {
            Meteor.f7.alert("Sie müssen erst Zugangscodes erstellen.", "Hinweiß");
            return;
        }

        //TODO option to reset password and remove confirms
        Meteor.f7.confirm('Nach dem Starten könne keine Änderungen mehr vorgenommen werden. Der neue Wettkampf wird automatisch aktiviert.', 'BJS starten', function () {
            Meteor.f7.confirm('Haben Sie alle Zugangscodes am Besten zwei mal gespeichert? Dafür kann man diese Ausdrucken, als PDF speichern oder abschreiben.', 'BJS starten', function () {
                Meteor.f7.confirm('Nach dem Starten können die Zugangscodes nicht erneut angezeigt werden. Stellen Sie sicher, dass Sie ohne "RunItEasy" Zugriff auf die Zugangscodes haben. Ansonsten müssen Sie einen neuen Wettkampf einrichten!', 'BJS starten', function () {
                    Meteor.f7.confirm('Jetzt starten?', 'BJS starten', function () {
                        const accounts = _.map(loginGroups.concat(loginStations), function (obj) {
                            return obj.account;
                        });

                        NewCompetition.save(accounts);

                        FlowRouter.go('/config');
                    });
                });
            });
        });
    },
    'click #btn-print' (event, instance) {
        window.print();
    },
    'click #btn-new-codes' (event, instance) {
        document.getElementById("btn-new-codes").setAttribute("disabled", "true");
        document.getElementById("btn-print").setAttribute("disabled", "true");
        document.getElementById("link_back").setAttribute("disabled", "true");
        document.getElementById("link_start").setAttribute("disabled", "true");

        // Load UI elements
        const progressBar = document.getElementById("progress-bar");
        const progressText = document.getElementById("progress-text");

        //load data
        const ct = NewCompetition.getCompetitionType();

        const sportTypes = _.map(_.filter(NewCompetition.getSports(), function (obj) {
            return obj.activated;
        }), function (obj) {
            return {
                stID: obj.stID,
                name: ct.getNameOfSportType(obj.stID)
            };
        });

        const accountNumber = Meteor.groups.length + sportTypes.length;

        //Delete old passwords
        loginGroups = [];
        loginStations = [];
        progressText.innerHTML = "0/" + accountNumber;
        Meteor.f7.setProgressbar("#progress-bar", 100);//TODO not working
        _login_tracker.changed();

        let counter = 0;

        const generateNextGroupLogin = function () {
            const groupID = counter - sportTypes.length;
            if (groupID < Meteor.groups.length) {
                const password = genRandomCode();

                const account = new Account([Meteor.groups[groupID].name], [], Crypto.generateAC(password));

                loginGroups.push({
                    name: Meteor.groups[groupID].name,
                    password: password,
                    account: account
                });
                Meteor.groups[groupID].account = account;

                counter++;
                _login_tracker.changed();
                progressText.innerHTML = counter + "/" + accountNumber; //TODO add progress bar

                setTimeout(generateNextStationLogin, 0);
            } else {
                document.getElementById("btn-new-codes").removeAttribute("disabled");
                document.getElementById("btn-print").removeAttribute("disabled");
                document.getElementById("link_back").removeAttribute("disabled");
                document.getElementById("link_start").removeAttribute("disabled");
            }
        };

        const generateNextStationLogin = function () {
            if (counter < sportTypes.length) {
                const password = genRandomCode();

                loginStations.push({
                    name: sportTypes[counter].name,
                    password: password,
                    account: new Account([], [sportTypes[counter].stID], Crypto.generateAC(password))
                });

                counter++;
                _login_tracker.changed();
                progressText.innerHTML = counter + "/" + accountNumber; //TODO add progress bar

                setTimeout(generateNextStationLogin, 0);
            } else {
                generateNextGroupLogin();
            }
        };

        generateNextStationLogin();
    }
});