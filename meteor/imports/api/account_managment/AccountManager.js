import {SessionAccount} from "./SessionAccount";
import {DBInterface} from "../database/DBInterface";
import {checkPermission} from "../../../client/components/login/router";


let inputGroupAccount = new SessionAccount('input_group_account');
let inputStationAccount = new SessionAccount('input_station_account');
let inputAdminAccount = new SessionAccount('input_admin_account');
let inputOutputAccount = new SessionAccount('input_output_account');

function logout(type) {
    if (type == "Gruppenleiter") {
        Session.set("inputSlideIndex", undefined);
        inputGroupAccount.logout();
    } else if (type == "Station") {
        inputStationAccount.logout();
    } else if (type == "Administrator") {
        inputAdminAccount.logout();
    } else if (type == "Urkunden") {
        inputOutputAccount.logout();
    }
}

function saveData() {
    const group_account = inputGroupAccount.get().account;
    const station_account = inputStationAccount.get().account;
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

/**
 * Object containing various function to manage account on the client.
 * @public
 * @namespace
 */
export let AccountManager = {
    /**
     * Returns the Group and station account
     * @return {{GroupAccount: AccountManagerResult, StationAccount: AccountManagerResult}}
     */
    retrieveAccounts: function () {
        return {
            GroupAccount: inputGroupAccount.get(),
            StationAccount: inputStationAccount.get(),
            AdminAccount: inputAdminAccount.get(),
            OutputAccount: inputOutputAccount.get()
        };
    },

    /**
     * Returns the group account
     * @returns {?AccountManagerResult}
     */
    getGroupAccount: function () {
        return inputGroupAccount.get();
    },

    /**
     * Returns the station account
     * @returns {?AccountManagerResult}
     */
    getStationAccount: function () {
        return inputStationAccount.get();
    },

    /**
     * Returns the station account
     * @returns {?AccountManagerResult}
     */
    getAdminAccount: function () {
        return inputAdminAccount.get();
    },

    /**
     * Returns the station account
     * @returns {?AccountManagerResult}
     */
    getOutputAccount: function () {
        return inputOutputAccount.get();
    },

    /**
     * Returns whether a group is logged in
     * @returns {*}
     */
    viewPermitted: function () {
        return inputGroupAccount.isLoggedIn();
    },

    /**
     * Returns whether a group AND a station are logged in
     * @returns {*}
     */
    inputPermitted: function () {
        return inputGroupAccount.isLoggedIn() && inputStationAccount.isLoggedIn();
    },

    /**
     * Login for an account
     * @param {string} type - The type of the account that will be logged in
     * @param {string} passphrase
     * @param [callback] - optional callback
     */
    login: function (type, passphrase, callback) {
        let account = inputGroupAccount;

        if (type == "Station") account = inputStationAccount;
        else if (type == "Administrator") account = inputAdminAccount;
        else if (type == "Urkunden") account = inputOutputAccount;


        account.setProcessing(true);
        DBInterface.waitForReady(function () {
            account.login(passphrase, function (logged_in) {
                if (!logged_in) {
                    if (typeof callback === 'function') callback(false, "Ungültiges Passwort.");
                } else if (type == "Gruppenleiter" && !account.isGroupAccount()) {
                    account.logout();
                    if (typeof callback === 'function') callback(false, "Das Passwort gehört nicht einer Gruppe an.");
                } else if (type == "Station" && !account.isStationAccount()) {
                    account.logout();
                    if (typeof callback === 'function') callback(false, "Das Passwort gehört nicht einer Station an.");
                } else if (type == "Administrator" && !account.isAdminAccount()) {
                    account.logout();
                    if (typeof callback === 'function') callback(false, "Dieser Benuzer hat keine Administrator Rechte.");
                } else if (type == "Urkunden" && !account.canViewResults()) {
                    account.logout();
                    if (typeof callback === 'function') callback(false, "Dieser Benutzer hat keine Berechtigung die Urkunden zu erstellen..");
                } else if (typeof callback === 'function') callback(true);
            });
        });
    },

    /**
     * Login for an account
     * @param {string} type - The type of the account that will be logged in
     * @param {boolean=} force - Skip confirmation
     */
    logout: function (type, force = false) {
        if (inputGroupAccount.isLoggedIn() && inputStationAccount.isLoggedIn()) {
            if (force) {
                saveData();
                logout(type);
                Meteor.inputDependency.changed();
            } else {
                Meteor.f7.confirm('Wenn Sie sich abmelden können die Daten nachträglich nicht mehr editiert werden!', 'Hinweis',
                    function () {
                        Meteor.f7.showPreloader('Speichere Daten');
                        saveData();
                        logout(type);
                        Meteor.inputDependency.changed();
                        setTimeout(function () {
                            checkPermission();
                            Meteor.f7.hidePreloader();
                        }, 1500);
                    }
                );
            }
        } else {
            logout(type);
        }
    },

    logoutAll: function () {
        inputAdminAccount.logout();
        inputOutputAccount.logout();
        inputStationAccount.logout();
        inputGroupAccount.logout();
        sessionStorage.removeItem("firstLogin");
    }
};
