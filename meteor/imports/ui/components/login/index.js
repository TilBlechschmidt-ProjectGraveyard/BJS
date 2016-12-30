import "./index.html";
import {AccountManagement} from "../../../api/AccountManagement";
import {DBInterface} from "../../../api/database/db_access";
import {selectDefaultAthlete} from "../../../startup/client/helpers";

Meteor.login_deps = new Tracker.Dependency();
fullscreen_deps = new Tracker.Dependency();

Template.login.helpers({
    accounts: function () {
        Meteor.login_deps.depend();
        return AccountManagement.retrieveAccounts();
    },
    input_permitted: function () {
        Meteor.login_deps.depend();
        return AccountManagement.inputPermitted();
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

    const accounts = AccountManagement.retrieveAccounts();
    accounts[event.target.dataset.name].processing = true;
    AccountManagement.storeAccounts(accounts);
    Meteor.login_deps.changed();

    setTimeout(function () {
        AccountManagement.login(type, password, function (success, err) {
            if (!success) {
                //TODO: Throw something at the user
                Meteor.f7.alert(err, "Fehler");
                password_input.value = "";
            }
            const accounts = AccountManagement.retrieveAccounts();
            accounts[type].processing = false;
            AccountManagement.storeAccounts(accounts);
            selectDefaultAthlete();
            Meteor.login_deps.changed();
        });
    }, 300);
}

Template.login.events({
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

        const accounts = AccountManagement.retrieveAccounts();
        if (accounts.Gruppenleiter.logged_in && accounts.Station.logged_in) {
            Meteor.f7.confirm('Die Daten können nachträglich nicht mehr editiert werden, wenn Sie sich abmelden!', 'Hinweis',
                function () {
                    Meteor.f7.showPreloader('Speichere Daten');

                    const group_account = AccountManagement.retrieveAccounts().Gruppenleiter.account;
                    const station_account = AccountManagement.retrieveAccounts().Station.account;
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

                    AccountManagement.logout(event.target.dataset.name, function () {
                        Meteor.login_deps.changed();
                        setTimeout(Meteor.f7.hidePreloader, 500);
                    });
                }
            );
        } else {
            AccountManagement.logout(event.target.dataset.name, function () {
                Meteor.login_deps.changed();
            });
        }
    }
});