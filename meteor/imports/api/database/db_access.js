const COLLECTIONS = require('../../api/database/collections')();
import {getCompetitionTypeByID} from "../logic/competition_type";
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
        return COLLECTIONS.Generic.handle.find().fetch()[0]._id;
    },

    /**
     * Returns the id of the contest settings document.
     * @returns {string} The id
     */
    getContestGenericID: function () {
        return COLLECTIONS.ContestGeneric.handle.find().fetch()[0]._id;
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

    /**
     * Sets the current competition type id
     * @param id
     */
    setCompetitionTypeID: function (id) {
        COLLECTIONS.ContestGeneric.handle.update({_id: DBInterface.getContestGenericID()}, {$set: {contestType: id}});
    },

    /**
     * Returns the current competition type id
     * @returns {number}
     */
    getCompetitionTypeID: function () {
        return COLLECTIONS.ContestGeneric.handle.findOne({_id: DBInterface.getContestGenericID()}).contestType;
    },

    /**
     * Returns the current competition type
     * @returns {object}
     */
    getCompetitionType: function () {
        return getCompetitionTypeByID(DBInterface.getCompetitionTypeID());
    },

    /**
     * Lists all competition
     * @returns {string[]}
     */
    listCompetition: function () {
        return COLLECTIONS.Generic.handle.findOne({_id: DBInterface.getGenericID()}).contests;
    },

    /**
     * Returns the current competition name
     * @returns {string}
     */
    getCompetitionName: function () {
        return COLLECTIONS.Generic.handle.findOne({_id: DBInterface.getGenericID()}).activeContest;
    },

    /**
     * Creates a new competition
     * @param {string} competitionName
     * @param {number} competitionTypeID
     * @param {object[]} encrypted_athletes
     * @param {Accounts[]} accounts
     */
    createCompetition: function (competitionName, competitionTypeID, encrypted_athletes, accounts) {
        //TODO implement

        const newDBHandler = new MongoInternals.RemoteCollectionDriver(Meteor.config.competitionMongoURL + competitionName);
        const ContestGeneric = Collection('ContestGeneric', true, newDBHandler);
        const Accounts = Collection('Accounts', true, newDBHandler);
        const Athletes = Collection('Athletes', true, newDBHandler);

        for (let athlete in encrypted_athletes) {
            Athletes.handle.insert(encrypted_athletes[athlete].enc);
        }

        for (let account in accounts) {
            Accounts.handle.insert(accounts[account]);
        }

        ContestGeneric.handle.insert({contestType: competitionTypeID});


        let listOFCompetitions = DBInterface.listCompetition();
        listOFCompetitions.push(competitionName);
        COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {$set: {contests: listOFCompetitions}});
        DBInterface.activateCompetition(competitionName);
    },

    /**
     * Activates a competition with a given name
     * @param {string} competitionName - The name of the competition
     */
    activateCompetition: function (competitionName) {
        COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {$set: {activeContest: competitionName}});
        process.exit();
    }
};