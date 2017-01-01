import {DBInterface} from "../database/db_access";
import {Crypto} from "../crypto/crypto";
import {isGroupAccount, isStationAccount} from "../logic/account";

const storage = window.sessionStorage;


/**
 *
 * @param {string} passphrase - The login passphrase entered by the user.
 * @param callback
 * @returns {?Account}
 */
export function getAccountByPassphrase(passphrase, callback) {
    DBInterface.waitForReady(function () {
        const remoteAccounts = Meteor.COLLECTIONS.Accounts.handle.find({}).fetch();
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
        if (typeof callback === 'function') callback(account);
    });
}

export function AccountManager(name) {
    this.name = name;
    this.storageID = "account" + name;
}

AccountManager.prototype = {

    /**
     * @typedef {Object} AccountManagerResult
     * @property {?Account} account - The account or undefined
     * @property {boolean} logged_in - Whether the account is logged in
     * @property {boolean} processing - Whether the account is processed
     */

    /**
     * Returns the account.
     * @returns AccountManagerResult
     */
    get: function () {
        if (!storage.getItem(this.storageID)) {
            this.logout();
        }
        return JSON.parse(storage.getItem(this.storageID));
    },

    store: function (account) {
        storage.setItem(this.storageID, JSON.stringify(account));
    },

    setProcessing: function (newStatus) {
        const account = this.get();
        account.processing = newStatus;
        this.store(account);
    },

    login: function (passphrase, callback) {
        this.setProcessing(true);
        let thisAccountManager = this;
        setTimeout(function () { //TODO remove timeout. its just for preloader testing
            getAccountByPassphrase(passphrase, function (account) {
                if (account === null && typeof callback === 'function') {
                    thisAccountManager.setProcessing(false);
                    callback(false, "Ungültiges Passwort.");
                } else {
                    thisAccountManager.store({
                        account: account,
                        logged_in: true,
                        processing: false
                    });

                    // Notify the caller
                    if (typeof callback === 'function') callback(true);
                }
            });
        }, 100);
    },

    logout: function () {
        this.store({
            account: undefined,
            logged_in: false,
            processing: false
        });
    },

    isLoggedIn: function () {
        return this.get().logged_in;
    },
    isGroupAccount: function () {
        return isGroupAccount(this.get().account);
    },
    isStationAccount: function () {
        return isStationAccount(this.get().account);
    }
};



