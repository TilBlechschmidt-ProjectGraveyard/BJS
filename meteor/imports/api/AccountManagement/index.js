import {DBInterface} from "../database/db_access";
import {Crypto} from "../crypto/crypto";
import {isGroupAccount, isStationAccount, getGroupNames, getStationNames} from "../logic/account";
const COLLECTIONS = require('../../api/database/collections')();
const storage = window.sessionStorage;

function storageAvailable(type) {
    try {
        const storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch (e) {
        return false;
    }
}

function setProcessingState(type, state) {

}

export let AccountManagement = {

    retrieveAccounts: function() {
        if (!storage.getItem("accounts")) {
            storage.setItem("accounts", JSON.stringify({
                "Gruppenleiter": {
                    account: undefined,
                    placeholder: "",
                    logged_in: false,
                    processing: false
                },
                "Station": {
                    account: undefined,
                    placeholder: "",
                    logged_in: false,
                    processing: false
                }
            }));
        }
        return JSON.parse(storage.getItem("accounts"));
    },

    storeAccounts: function (data) {
        storage.setItem("accounts", JSON.stringify(data));
    },

    login: function (type, passphrase, callback) {
        DBInterface.waitForReady(function () {
            // Check if the passphrase is valid
            const remoteAccounts = COLLECTIONS.Accounts.handle.find({}).fetch();
            let account = null;
            for (let remoteAccount in remoteAccounts) {
                if (!remoteAccounts.hasOwnProperty(remoteAccount)) continue;

                remoteAccount = remoteAccounts[remoteAccount];

                if (remoteAccount.ac.pubHash == Crypto.generatePubHash(passphrase, remoteAccount.ac.salt)) {
                    account = remoteAccount;
                    account.ac.privHash = Crypto.generatePrivHash(passphrase, remoteAccount.ac.salt);
                    break;
                }
            }
            if (account === null && typeof callback === 'function') {
                callback(false, "Ungültiges Passwort.");
                return;
            }

            const accounts = AccountManagement.retrieveAccounts();

            // Check whether or not the account matches the type and fill in the placeholder
            if (type == "Gruppenleiter") {
                if (!isGroupAccount(account)) {
                    console.log("NOT A GROUP ACCOUNT");
                    callback(false, "Das Passwort gehört nicht einer Gruppe an.");
                    return;
                } else {
                    accounts[type].placeholder = getGroupNames(account);
                }
            } else if (type == "Station") {
                if (!isStationAccount(account)) {
                    console.log("NOT A STATION ACCOUNT");
                    callback(false, "Das Passwort gehört nicht einer Station an.");
                    return;
                } else {
                    accounts[type].placeholder = getStationNames(account, DBInterface.getCompetitionType());
                }
            }

            // Write the information out into the storage
            accounts[type].account = account;
            accounts[type].logged_in = true;
            AccountManagement.storeAccounts(accounts);

            // Notify the caller
            if (typeof callback === 'function') callback(true);
        });
    },

    logout: function (type, callback) {
        DBInterface.waitForReady(function () {
            const accounts = AccountManagement.retrieveAccounts();
            console.log(type);
            console.log(accounts);
            accounts[type].logged_in = false;
            accounts[type].account = undefined;
            console.log(accounts);

            AccountManagement.storeAccounts(accounts);
            if (typeof callback === 'function') callback();
        });
    },

    checkAvailability: function () {
        if (!storageAvailable('sessionStorage'))
            console.error("ERROR - Session storage is not available!");
    },

    clearSession: function () {
        storage.clear();
    }

};