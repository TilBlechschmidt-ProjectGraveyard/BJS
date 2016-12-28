const COLLECTIONS = require('../../api/database/collections')();

import {Athlete} from "../logic/athlete";

/**
 * Object containing all information and functions required for Swimming contest.
 * @public
 * @namespace
 */
export let DBInterface = {
    /**
     * This function waits asynchronously until all collections are ready. Then it calls the callback.
     * @param {function} callback - The callback
     */
    waitForReady: function (callback) {
        COLLECTIONS.Generic.onReady(function () { //TODO automate for all collections
            COLLECTIONS.ContestGeneric.onReady(function () {
                COLLECTIONS.Accounts.onReady(function () {
                    COLLECTIONS.Athletes.onReady(function () {
                        callback();
                    });
                });
            });
        });
    },
    /**
     *
     * @param {Log} log - A log object
     * @param {Account[]} accounts - The account
     * @param {boolean} require_signature - Only decrypt data if the signature can be verified. Should be true for final certificate creation.
     * @returns {Athlete[]}
     */
    getAthletesOfAccounts: function (log, accounts, require_signature) {
        let result = [];
        log.disable();
        COLLECTIONS.Athletes.handle.find().fetch().forEach(function (obj) {
            const decrypted = Athlete.decryptFromDatabase(log, obj, accounts, require_signature);
            if (decrypted) {
                result.push(decrypted);
            }
        });
        log.enable();
        return result;
    },

    setCompetitonType: function (id) {

    }
};