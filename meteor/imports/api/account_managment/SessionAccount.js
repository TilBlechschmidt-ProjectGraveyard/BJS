import {DBInterface} from "../database/DBInterface";
import {Crypto} from "../crypto/crypto";
import {isGroupAccount, isStationAccount, isAdminAccount} from "../logic/account";

const storage = window.sessionStorage;

/**
 *
 * @param {string} passphrase - The login passphrase entered by the user.
 * @param callback
 * @returns {?Account}
 */
export function getAccountByPassphrase(passphrase, callback) {
    DBInterface.waitForReady(function () {
        const contestAccounts = Meteor.COLLECTIONS.Accounts.handle.find({}).fetch();
        const adminAccount = Meteor.COLLECTIONS.Generic.handle.findOne().adminAccount;
        const remoteAccounts = contestAccounts.concat([adminAccount]);
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

/**
 * Creates a new session account
 * @param {string} name - The name that is used to store data in the session storage. Must be unique for every account but can be used multiple times to access the same account from different parts of the application.
 * @constructor
 */
export function SessionAccount(name) {
    this.name = name;
    this.storageID = "account" + name;

    //check if account is still valid
    const lastAccount = this.get();
    if (lastAccount.logged_in) {
        const that = this;
        DBInterface.waitForReady(function () {
            const adminAccount = Meteor.COLLECTIONS.Generic.handle.findOne({}).adminAccount;

            if ((lastAccount.account.ac.pubHash != adminAccount.ac.pubHash) && !Meteor.COLLECTIONS.Accounts.handle.findOne({'ac.pubHash': lastAccount.account.ac.pubHash})) {
                that.logout();
                //close all indicators or preloaders
                Meteor.f7.hideIndicator();
                Meteor.f7.hidePreloader();
                FlowRouter.go('/login');
            }
        });
    }
}

SessionAccount.prototype = {

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

    /**
     * Updates the data stored in the session storage. Shouldn't be called from outside.
     * @returns AccountManagerResult
     */
    store: function (account) {
        storage.setItem(this.storageID, JSON.stringify(account));
    },

    /**
     * Updates the processing status. Shouldn't be called from outside.
     * @param newStatus
     */
    setProcessing: function (newStatus) {
        const account = this.get();
        account.processing = newStatus;
        this.store(account);
    },

    /**
     * Login for an account
     * @param {string} passphrase - The password
     * @param [callback] - optional callback
     */
    login: function (passphrase, callback) {
        this.setProcessing(true);
        let thisSessionAccount = this;
        setTimeout(function () { //TODO remove timeout. its just for preloader testing
            getAccountByPassphrase(passphrase, function (account) {
                if (account === null && typeof callback === 'function') {
                    thisSessionAccount.setProcessing(false);
                    callback(false, "Ungültiges Passwort.");
                } else {
                    thisSessionAccount.store({
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

    /**
     * logout for the account
     */
    logout: function () {
        this.store({
            account: undefined,
            logged_in: false,
            processing: false
        });
    },

    /**
     * Returns whether the account is logged in
     * @returns {boolean}
     */
    isLoggedIn: function () {
        return this.get().logged_in;
    },

    /**
     * Returns whether the account has permissions for at least on group
     * @returns {boolean}
     */
    isGroupAccount: function () {
        return isGroupAccount(this.get().account);
    },

    /**
     * Returns whether the account has permissions for at least on station
     * @returns {boolean}
     */
    isStationAccount: function () {
        return isStationAccount(this.get().account);
    },

    /**
     * Returns whether the account has admin permissions
     * @returns {boolean}
     */
    isAdminAccount: function () {
        return isAdminAccount(this.get().account);
    },

    /**
     * Returns whether the account is allowed to generate certificates
     * @returns {boolean}
     */
    canViewResults: function () {
        return this.get().account.canViewResults;
    }
};



