import {getCompetitionTypeByID} from "../logic/competition_type";
import {Athlete} from "../logic/athlete";
import {initCollections} from "./collections/index";
import {getLoginObject} from "../logic/account";
import {Log} from "../log";
import {Crypto} from "../crypto/crypto";


if (Meteor.isClient) {
    initCollections();
}

/**
 * Object containing all information and functions required for Swimming contest.
 * @public
 * @namespace
 */
export let DBInterface = {

    /**
     * Returns whether all collections are ready.
     * @return {boolean}
     */
    isReady: function () {
        return Meteor.COLLECTIONS.Generic.isReady() &&
            Meteor.COLLECTIONS.Contests.isReady() &&
            Meteor.COLLECTIONS.Accounts.isReady() &&
            Meteor.COLLECTIONS.Athletes.isReady();
    },

    /**
     * This function waits asynchronously until all collections are ready. Then it calls the callback.
     * @param {function} callback - The callback
     */
    waitForReady: function (callback) {
        Meteor.COLLECTIONS.Generic.onReady(function () { //TODO automate for all collections
            Meteor.COLLECTIONS.Contests.onReady(function () {
                Meteor.COLLECTIONS.Accounts.onReady(function () {
                    Meteor.COLLECTIONS.Athletes.onReady(function () {
                        callback();
                    });
                });
            });
        });
        // let onReadyFunctions = [];
        // for (let collection in COLLECTIONS) {
        //     if (!COLLECTIONS.hasOwnProperty(collection)) continue;
        //     collection = COLLECTIONS[collection];
        //     onReadyFunctions.push(collection.onReady);
        // }
        //
        // parallel(onReadyFunctions, function () {
        //     callback();
        // });
    },

    /**
     * Returns the id of the server settings document.
     * @returns {string} The id
     */
    getGenericID: function () {
        return Meteor.COLLECTIONS.Generic.handle.find().fetch()[0]._id;
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
        //iterate athletes
        Meteor.COLLECTIONS.Athletes.handle.find().fetch().forEach(function (obj) {
            //try to decrypt with accounts
            const decrypted = Athlete.decryptFromDatabase(log, obj, accounts, require_signature);

            //if decrypted add to result
            if (decrypted) {
                result.push(decrypted);
            }
        });
        log.enable();
        return result;
    },

    /**
     * Returns the active contest database ID
     * @returns {string}
     */
    getActiveContestID: function () {
        return Meteor.COLLECTIONS.Generic.handle.findOne({_id: DBInterface.getGenericID()}).activeContest;
    },

    /**
     * Returns the active contest object
     * @returns {object}
     */
    getActiveContest: function () {
        return Meteor.COLLECTIONS.Contests.handle.findOne({_id: DBInterface.getActiveContestID()});
    },

    getContestByID: function (contestID) {
        return Meteor.COLLECTIONS.Contests.handle.findOne({_id: contestID});
    },

    /**
     * Returns a list of the activated sports of the current competition
     * @returns {string[]}
     */
    getActivatedSports: function (contestID) {
        if (!contestID) contestID = DBInterface.getActiveContestID();
        return DBInterface.getContestByID(contestID).sportTypes;
    },

    /**
     * Returns the current or a given competition type id
     * @param {Mongo.Collection} [contestID] - Handle of the db
     * @returns {number}
     */
    getCompetitionTypeID: function (contestID) {
        if (!contestID) contestID = DBInterface.getActiveContestID();
        return DBInterface.getContestByID(contestID).type;
    },

    /**
     * Returns the current or a given competition type
     * @param {Mongo.Collection} [contestID] - Handle of the db
     * @returns {object}
     */
    getCompetitionType: function (contestID) {
        if (!contestID) contestID = DBInterface.getActiveContestID();
        return getCompetitionTypeByID(DBInterface.getCompetitionTypeID(contestID));
    },

    /**
     * Returns the activated sport types of the current or a given competition
     * @param {Mongo.Collection} [contestID] - Handle of the db
     * @returns {string[]}
     */
    getCompetitionSportTypes: function (contestID) {
        if (!contestID) contestID = DBInterface.getActiveContestID();
        return DBInterface.getContestByID(contestID).sportTypes;
    },

    /**
     * Returns the current competition name
     * @returns {string}
     */
    getCompetitionName: function () {
        return DBInterface.getActiveContest().name;
    },

    /**
     * Returns a list of athletes by competition ID
     */
    getAthletesByCompetition: function (account, competitionID, callback) {
        const loginObject = getLoginObject(account);
        Meteor.call('getAthletesByCompetitionID', loginObject, competitionID, function (err, enc_data) {
            if (typeof callback === 'function') {
                const log = new Log();
                const data = Crypto.tryDecrypt(log, enc_data, [account.ac]);
                if (data) {
                    callback(data.data);
                } else if (Meteor.isClient) {
                    Meteor.f7.alert("Es gab eine Fehler beim Verbinden mit dem Server. Bitte melden Sie sich ab und versuchen sie es erneut.");
                }
            }
        });
    },

    /**
     * Set the state of a sportType for a given competition ID
     */
    setSportTypeState: function (account, competitionID, sportTypeID, state, callback) {
        const loginObject = getLoginObject(account);
        Meteor.call('setSportTypeState', loginObject, competitionID, sportTypeID, state, function (err, enc_data) {
            if (typeof callback === 'function') {
                const log = new Log();
                const data = Crypto.tryDecrypt(log, enc_data, [account.ac]);
                if (data) {
                    callback(data.data);
                } else if (Meteor.isClient) {
                    Meteor.f7.alert("Es gab eine Fehler beim Verbinden mit dem Server. Bitte melden Sie sich ab und versuchen sie es erneut.");
                }
            }
        });
    },

    /**
     * Creates a new competition
     * @param {Account} account - Admin account
     * @param {string} competitionName - The name of the competition
     * @param {number} competitionTypeID - The type id of the competition
     * @param {string[]} sportTypes - List of sport type ids which are used by the contest
     * @param {object[]} encrypted_athletes - A list of encrypted athletes. To encrypt an athlete use athlete.encryptForDatabase([...])
     * @param {Account[]} accounts - A list of accounts
     * @param final
     * @param [callback] optional callback
     */
    writeCompetition: function (account, competitionName, competitionTypeID, sportTypes, encrypted_athletes, accounts, final, callback) {
        const loginObject = getLoginObject(account);
        Meteor.call('writeCompetition', loginObject, competitionName, competitionTypeID, sportTypes, encrypted_athletes, accounts, final, function (err, enc_data) {
            if (typeof callback === 'function') {
                const log = new Log();
                const data = Crypto.tryDecrypt(log, enc_data, [account.ac]);
                if (data) {
                    callback(data.data);
                } else if (Meteor.isClient) {
                    Meteor.f7.alert("Es gab eine Fehler beim Verbinden mit dem Server. Bitte melden Sie sich ab und versuchen sie es erneut.");
                }
            }
        });
    },

    /**
     * Activates a competition with a given name
     * @param {Account} account - Admin account
     * @param {string} competitionName - The name of the competition
     * @param [callback] - optional callback
     */
    activateCompetition: function (account, competitionName, callback) {
        const loginObject = getLoginObject(account);
        Meteor.call('activateCompetition', loginObject, competitionName, function (err, enc_data) {
            if (typeof callback === 'function') {
                const log = new Log();
                const data = Crypto.tryDecrypt(log, enc_data, [account.ac]);
                if (data) {
                    callback(data.data);
                } else if (Meteor.isClient) {
                    Meteor.f7.alert("Es gab eine Fehler beim Verbinden mit dem Server. Bitte melden Sie sich ab und versuchen sie es erneut.");
                }
            }
        });
    },

    /**
     * Removes a competition with a given name. The actual data are still in the db. Only the link is deleted.
     * @param {Account} account - Admin account
     * @param {string} competitionName - The name of the competition
     * @param [callback] - optional callback
     */
    removeCompetition: function (account, competitionName, callback) {
        const loginObject = getLoginObject(account);
        Meteor.call('removeCompetition', loginObject, competitionName, function (err, enc_data) {
            if (typeof callback === 'function') {
                const log = new Log();
                const data = Crypto.tryDecrypt(log, enc_data, [account.ac]);
                if (data) {
                    callback(data.data);
                } else if (Meteor.isClient) {
                    Meteor.f7.alert("Es gab eine Fehler beim Verbinden mit dem Server. Bitte melden Sie sich ab und versuchen sie es erneut.");
                }
            }
        });
    },
    /**
     * Returns information about a competition in edit mode with a given name.
     * @param {Account} account - Admin account
     * @param {string} competitionName - The name of the competition
     * @param [callback] - optional callback
     */
    getEditInformation: function (account, competitionName, callback) {
        const loginObject = getLoginObject(account);
        Meteor.call('getEditInformation', loginObject, competitionName, function (err, enc_data) {
            if (typeof callback === 'function') {
                const log = new Log();
                const data = Crypto.tryDecrypt(log, enc_data, [account.ac]);
                if (data) {
                    callback(data.data);
                } else if (Meteor.isClient) {
                    Meteor.f7.alert("Es gab eine Fehler beim Verbinden mit dem Server. Bitte melden Sie sich ab und versuchen sie es erneut.");
                }
            }
        });
    },

    /**
     * Marks the certificate of an athlete as written.
     * @param {Account} account - Output account
     * @param {boolean} id - The meteor db id of the athlete
     * @param [callback] - optional callback
     */
    certificateUpdate: function (account, id, callback) {
        const loginObject = getLoginObject(account);
        Meteor.call('certificateUpdate', loginObject, id, function (err, enc_data) {
            if (typeof callback === 'function') {
                const log = new Log();
                const data = Crypto.tryDecrypt(log, enc_data, [account.ac]);
                if (data) {
                    callback(data.data);
                } else if (Meteor.isClient) {
                    Meteor.f7.alert("Es gab eine Fehler beim Verbinden mit dem Server. Bitte melden Sie sich ab und versuchen sie es erneut.");
                }
            }
        });
    },

    /**
     * Generates certificates for the current competition
     * @param {Account} account - Output account
     * @param {object[]} athleteIDs - List of athlete ids
     * @param [callback] - optional callback
     */
    generateCertificates: function (account, athleteIDs, callback) {
        const loginObject = getLoginObject(account);
        Meteor.call('generateCertificates', loginObject, athleteIDs, function (err, enc_data) {
            if (typeof callback === 'function') {
                const log = new Log();
                const data = Crypto.tryDecrypt(log, enc_data, [account.ac]);
                if (data) {
                    callback(data.data);
                } else if (Meteor.isClient) {
                    Meteor.f7.alert("Es gab eine Fehler beim Verbinden mit dem Server. Bitte melden Sie sich ab und versuchen sie es erneut.");
                }
            }
        });
    },

    /**
     * Generates certificates for the current competition
     * @param [callback] - optional callback
     */
    getServerIPs: function (callback) {
        Meteor.call('getServerIPs', function (err, data) {
            if (typeof callback === 'function') {
                callback(data);
            }
        });
    }
};