import "./login.html";
import {DBInterface} from "../../../api/database/db_access";
import {selectDefaultAthlete} from "../../../startup/client/helpers";
import {InputAccountManager} from "../../../api/account_managment/InputAccountManager";

Meteor.inputDependency = new Tracker.Dependency();
fullscreen_deps = new Tracker.Dependency();

Template.inputLogin.helpers({
    accounts: function () {
        Meteor.inputDependency.depend();
        const accounts = InputAccountManager.retrieveAccounts();
        accounts.GroupAccount.description = "Gruppenleiter";
        accounts.StationAccount.description = "Stationsleiter";
        if (accounts.GroupAccount.logged_in)
            accounts.GroupAccount.placeholder = accounts.GroupAccount.account.name;
        if (accounts.StationAccount.logged_in)
            accounts.StationAccount.placeholder = accounts.StationAccount.account.name;

        return accounts;
    },
    view_permitted: function () {
        Meteor.inputDependency.depend();
        return InputAccountManager.viewPermitted() && !InputAccountManager.inputPermitted();
    },
    input_permitted: function () {
        Meteor.inputDependency.depend();
        return InputAccountManager.inputPermitted();
    },
    fullscreen: function () {
        fullscreen_deps.depend();
        return isFullscreen();
    }
});

function isFullscreen() {
    const doc = window.document;

    return !(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement);
}

function toggleFullScreen() {
    const doc = window.document;
    const docEl = doc.documentElement;

    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if (!isFullscreen()) {
        requestFullScreen.call(docEl);
    } else {
        cancelFullScreen.call(doc);
    }
    fullscreen_deps.changed();
}

function login(event) {
    const type = event.target.dataset.name;
    const password_input = document.getElementById(type + "_pwd");
    const password = password_input.value;

    Meteor.inputDependency.changed();

    // setTimeout(function () {
    InputAccountManager.login(type, password, function (success, err) {
            if (!success) {
                //TODO: Throw something at the user
                Meteor.f7.alert(err, "Fehler");
                password_input.value = "";
            }
            selectDefaultAthlete();
        Meteor.inputDependency.changed();
        });
    Meteor.inputDependency.changed();
    // }, 300);
}

Template.inputLogin.events({
    'click .fullscreen-toggle': function () {
        toggleFullScreen();
    },
    'keypress input': function (event) {
        if (event.keyCode == 13) {
            if (event.target.dataset.name) login(event);
            event.stopPropagation();
            return false;
        }
    },
    'click .login-button': function (event) {
        event.preventDefault();
        login(event);
    },
    'click .logout-button': function (event) {
        event.preventDefault();

        const groupAccount = InputAccountManager.getGroupAccount();
        const stationAccount = InputAccountManager.getStationAccount();

        if (groupAccount.logged_in && stationAccount.logged_in) {
            Meteor.f7.confirm('Die Daten können nachträglich nicht mehr editiert werden, wenn Sie sich abmelden!', 'Hinweis',
                function () {
                    Meteor.f7.showPreloader('Speichere Daten');

                    const group_account = groupAccount.account;
                    const station_account = stationAccount.account;
                    const athletes = DBInterface.getAthletesOfAccounts(Meteor.input.log, [group_account], false);

                    if (sessionStorage.getItem("measurements")) {
                        const measurements = JSON.parse(sessionStorage.getItem("measurements"));
                        // Loop through all athletes
                        for (let athlete in athletes) {
                            if (!athletes.hasOwnProperty(athlete)) continue;
                            athlete = athletes[athlete];
                            // Check if there is some data for the athlete in the session storage
                            if (measurements[athlete.id]) {
                                // Loop through the sport types
                                for (let stID in measurements[athlete.id]) {
                                    if (!measurements[athlete.id].hasOwnProperty(stID)) continue;
                                    // Add all measurements for the sport type to the athlete
                                    athlete.addMeasurement(Meteor.input.log, stID,
                                        lodash.map(measurements[athlete.id][stID], function (measurement) {
                                            return measurement;
                                        }),
                                        group_account, station_account);
                                }
                            }
                        }

                        sessionStorage.setItem("measurements", "{}");
                    }

                    InputAccountManager.logout(event.target.dataset.name);
                    Meteor.inputDependency.changed();
                    setTimeout(Meteor.f7.hidePreloader, 500);
                }
            );
        } else {
            InputAccountManager.logout(event.target.dataset.name);
            Meteor.inputDependency.changed();
        }
    }
});