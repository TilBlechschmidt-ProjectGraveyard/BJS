import {AccountManager} from "./AccountManager";
import {DBInterface} from "../database/db_access";


let inputGroupAccount = new AccountManager('input_group_account');
let inputStationAccount = new AccountManager('input_station_account');

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
        if (type == "GroupAccount") inputGroupAccount.setProcessing(true);
        else                        inputStationAccount.setProcessing(true);
        DBInterface.waitForReady(function () {
            if (type == "GroupAccount") {
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

    logout: function (type) {
        if (type == "GroupAccount") {
            inputGroupAccount.logout();
        } else {
            inputStationAccount.logout();
        }
    },
};
