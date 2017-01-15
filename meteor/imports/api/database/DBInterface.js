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
 * Runs a function on the server and handels de/encryption and callback handling.
 * @param {string} name - The name of the server function
 * @param {Account} account - The account that is used to authenticate
 * @param {*} data - A data object which will be passed to the function. These data will be send encrypted.
 * @param callback - A callback with one parameter: The return value of the server function
 */
function runServerFunction(name, account, data, callback) {
    const loginObject = getLoginObject(account);
    Meteor.call('runServerFunction', name, loginObject, Crypto.encrypt(data, account.ac, account.ac), function (err, enc_data) {
        const log = new Log();
        const data = Crypto.tryDecrypt(log, enc_data, [account.ac]);
        if (data) {
            if (typeof callback === 'function') callback(data.data);
        } else if (Meteor.isClient) {
            Meteor.f7.alert("Es gab einen Fehler beim Verbinden mit dem Server. Bitte melden Sie sich ab und versuchen sie es erneut.", "Fehler");
        }
    });
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
     * Returns a list of groups by competition ID
     */
    getAthletesByCompetition: function (account, competitionID, require_signature, require_group_check, callback) {
        const log = new Log();
        runServerFunction('getAthletesByCompetitionID', account, {
            competitionID: competitionID,
            require_signature: require_signature,
            require_group_check: require_group_check
        }, function (groups) {
            for (let groupIndex in groups) {
                if (!groups.hasOwnProperty(groupIndex)) continue;
                let athletes = [];
                for (let athleteIndex in groups[groupIndex].athletes) {
                    if (!groups[groupIndex].athletes.hasOwnProperty(athleteIndex)) continue;
                    athletes.push(Athlete.fromObject(log, groups[groupIndex].athletes[athleteIndex]));
                }
                groups[groupIndex].athletes = athletes;
            }
            if (typeof callback === 'function') callback(groups);
        });
    },

    /**
     * Set the state of a sportType for a given competition ID
     * @param account
     * @param competitionID
     * @param sportTypeID
     * @param state
     * @param callback
     */
    setSportTypeState: function (account, competitionID, sportTypeID, state, callback) {
        runServerFunction('setSportTypeState', account, {
            competitionID: competitionID,
            sportTypeID: sportTypeID,
            state: state
        }, callback);
    },

    writeAthletes: function (account, competitionID, encryptedAthletes, callback) {
        runServerFunction('writeAthletes', account, {
            competitionID: competitionID,
            encryptedAthletes: encryptedAthletes
        }, callback);
    },

    writeAccounts: function (account, competitionID, accounts, callback) {
        runServerFunction('writeAccounts', account, {competitionID: competitionID, accounts: accounts}, callback);
    },

    lockCompetition: function (account, competitionID, callback) {
        runServerFunction('lockCompetition', account, {competitionID: competitionID}, callback);
    },

    addCompetition: function (account, name, competitionType) {
        runServerFunction('addCompetition', account, {name: name, competitionType: competitionType});
    },

    /**
     * Renames a competition with a given name
     * @param {Account} account - Admin account
     * @param {string} competitionID - The id of the competition
     * @param {string} newName - The new name
     * @param [callback] - optional callback
     */
    renameCompetition: function (account, competitionID, newName, callback) {
        runServerFunction('renameCompetition', account, {competitionID: competitionID, newName: newName}, callback);
    },

    /**
     * Activates a competition with a given name
     * @param {Account} account - Admin account
     * @param {string} competitionID - The id of the competition
     * @param [callback] - optional callback
     */
    activateCompetition: function (account, competitionID, callback) {
        runServerFunction('activateCompetition', account, {competitionID: competitionID}, callback);
    },

    /**
     * Removes a competition with a given name. The actual data are still in the db. Only the link is deleted.
     * @param {Account} account - Admin account
     * @param {string} competitionID - The name of the competition
     * @param [callback] - optional callback
     */
    removeCompetition: function (account, competitionID, callback) {
        runServerFunction('removeCompetition', account, {competitionID: competitionID}, callback);
    },
    /**
     * Marks the certificate of an athlete as written.
     * @param {Account} account - Output account
     * @param {boolean} id - The meteor db id of the athlete
     * @param [callback] - optional callback
     */
    certificateUpdate: function (account, id, callback) {
        runServerFunction('certificateUpdate', account, {id: id}, callback);
    },

    /**
     * Generates certificates for the current competition
     * @param {Account} account - Output account
     * @param {object[]} athleteIDs - List of athlete ids
     * @param [callback] - optional callback
     */
    generateCertificates: function (account, athleteIDs, callback) {
        runServerFunction('generateCertificates', account, {athleteIDs: athleteIDs}, callback);
    },

    /**
     * Generates certificates for the current competition
     * @param [callback] - optional callback
     */
    getServerIPs: function (callback) {
        runServerFunction('getServerIPs', account, {}, callback);
    }
};