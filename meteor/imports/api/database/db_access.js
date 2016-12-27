const COLLECTIONS = require('../../api/database/collections')();

import {Athlete} from "../logic/athlete";

export function waitForReady(callback) {

    COLLECTIONS.Generic.onReady(function () { //TODO automate for all collections
        COLLECTIONS.Accounts.onReady(function () {
            COLLECTIONS.Athletes.onReady(function () {
                callback();
            });
        });
    });
}

export function getAthletesOfAccounts(log, account, require_signature) {
    let result = [];
    log.disable();
    COLLECTIONS.Athletes.handle.find().fetch().forEach(function (obj) {
        const decrypted = Athlete.decryptFromDatabase(log, obj, account, require_signature);
        if (decrypted) {
            result.push(decrypted);
        }
    });
    log.enable();
    return result;
}