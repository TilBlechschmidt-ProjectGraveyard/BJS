import {AccountManager} from "./AccountManager";
import {DBInterface} from "../database/db_access";
import {checkPermission} from "../../ui/components/login/router";


let inputGroupAccount = new AccountManager('input_group_account');
let inputStationAccount = new AccountManager('input_station_account');

function logout(type) {
    if (type == "Gruppenleiter") {
        inputGroupAccount.logout();
    } else {
        inputStationAccount.logout();
    }
}

function saveData() {
    const group_account = inputGroupAccount.get();
    const station_account = inputStationAccount.get();
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
}

export let InputAccountManager = {
    /**
     * Returns the Group and station account
     * @return {{GroupAccount: AccountManagerResult, StationAccount: AccountManagerResult}}
     */
    retrieveAccounts: function () {
        return {
            GroupAccount: inputGroupAccount.get(),
            StationAccount: inputStationAccount.get()
        };
    },

    /**
     * Returns the group account
     * @returns {*|AccountManagerResult}
     */
    getGroupAccount: function () {
        return inputGroupAccount.get();
    },

    /**
     * Returns the station account
     * @returns {*|AccountManagerResult}
     */
    getStationAccount: function () {
        return inputStationAccount.get();
    },

    viewPermitted: function () {
        return inputGroupAccount.isLoggedIn();
    },

    inputPermitted: function () {
        return inputGroupAccount.isLoggedIn() && inputStationAccount.isLoggedIn();
    },

    login: function (type, passphrase, callback) {
        //TODO Make this login function work on the admin account as well
        if (type == "Gruppenleiter") inputGroupAccount.setProcessing(true);
        else                        inputStationAccount.setProcessing(true);
        DBInterface.waitForReady(function () {
            if (type == "Gruppenleiter") {
                inputGroupAccount.login(passphrase, function (logged_in) {
                    if (!logged_in) {
                        if (typeof callback === 'function') callback(false, "Ungültiges Passwort.");
                    } else if (!inputGroupAccount.isGroupAccount()) {
                        inputGroupAccount.logout();
                        if (typeof callback === 'function') callback(false, "Das Passwort gehört nicht einer Gruppe an.");
                    } else {
                        if (typeof callback === 'function') callback(true);
                    }
                });
            } else {
                inputStationAccount.login(passphrase, function (logged_in) {
                    if (!logged_in) {
                        if (typeof callback === 'function') callback(false, "Ungültiges Passwort.");
                    } else if (!inputStationAccount.isStationAccount()) {
                        inputStationAccount.logout();
                        if (typeof callback === 'function') callback(false, "Das Passwort gehört nicht einer Station an.");
                    } else {
                        if (typeof callback === 'function') callback(true);
                    }
                });
            }
        });
    },

    logout: function (type, force) {
        if (inputGroupAccount.isLoggedIn() && inputStationAccount.isLoggedIn()) {
            if (force) {
                saveData();
                logout(type);
                Meteor.inputDependency.changed();
            } else {
                Meteor.f7.confirm('Die Daten können nachträglich nicht mehr editiert werden, wenn Sie sich abmelden!', 'Hinweis',
                    function () {
                        Meteor.f7.showPreloader('Speichere Daten');
                        saveData();
                        logout(type);
                        Meteor.inputDependency.changed();
                        setTimeout(function () {
                            checkPermission();
                            Meteor.f7.hidePreloader();
                        }, 2500);
                    }
                );
            }
        } else {
            logout(type);
        }
    },
};
