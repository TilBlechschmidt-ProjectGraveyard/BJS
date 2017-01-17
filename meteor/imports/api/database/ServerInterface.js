import {getContestTypeByID} from "../logic/contestType";
import {Athlete} from "../logic/athlete";
import {initCollections} from "./collections/index";
import {getLoginObject} from "../logic/account";
import {Log} from "../log";
import {Crypto} from "../crypto/crypto";
import {asyncServerFunctionChannel} from "../streamer";

if (Meteor.isClient) {
    initCollections();
}

function throwError(account, returnPromise) {
    const err = new Error("Error whilst calling a server function.");
    console.error("-------- Error Context --------");
    console.error("Function called:", name);
    console.error("Account used:", account);
    console.error("Data to be transmitted:", data);
    console.error("Callback passed:", callback);
    console.error("Return type:", returnPromise ? "Promise" : "Callback");
    Meteor.f7.alert("Es gab einen Fehler beim Verbinden mit dem Server. Bitte melden Sie sich ab und versuchen Sie es erneut.", "Fehler");
    throw err;
}

/**
 * Runs a function server-side and takes care of de-/encryption for you. It calls the callback once with the results returned from the server.
 * @param {string} name - The name of the server function
 * @param {Account} account - The account that is used to authenticate
 * @param {*} data - A data object which will be passed to the function. These data will be send encrypted.
 * @param {function} [callback] - A callback with one parameter: The return value of the server function. Function returns a promise if it is undefined.
 */
function runServerFunction(name, account, data, callback) {
    const loginObject = getLoginObject(account);
    const log = Log.getLogObject();
    const returnPromise = typeof callback !== 'function';
    const callFunction = returnPromise ? Meteor.callPromise : Meteor.call;

    const promise = callFunction('runServerFunction', name, loginObject, Crypto.encrypt(data, account.ac, account.ac), function (err, enc_data) {
        const data = Crypto.tryDecrypt(log, enc_data, [account.ac]);
        if (data) {
            if (typeof callback === 'function') callback(data.data);
        } else if (Meteor.isClient) {
            throwError(account, returnPromise);
        }
    });

    if (returnPromise)
        return promise.then(data => {
            const decrypted_data = Crypto.tryDecrypt(log, data, [account.ac]);

            if (!decrypted_data && Meteor.isClient)
                throwError(account, returnPromise);
            else
                return decrypted_data.data;
        });
}

/**
 * Runs a function server-side in an asynchronous manner and takes care of de-/encryption for you. It calls the callback for every entry returned.
 * @param {string} name - The name of the server function
 * @param {Account} account - The account that is used to authenticate
 * @param {*} data - A data object which will be passed to the function. These data will be send encrypted.
 * @param {function} callback - A callback with one parameter: The return value of the server function. Function returns a promise if it is undefined.
 * @returns {Promise.<void>}
 */
async function runAsyncServerFunction(name, account, data, callback, doneCallback) {
    const log = Log.getLogObject();
    const connection = await runServerFunction('runAsync', account, {name: name, data: data});

    asyncServerFunctionChannel.on(connection.uuid, function (encryptedEntry) {
        const entry = Crypto.tryDecrypt(log, encryptedEntry, [account.ac]);

        if (entry && !entry.data.permissionDenied) {
            if (entry.data.done && typeof doneCallback === 'function') doneCallback(entry.data);
            else if (typeof callback === 'function') callback(entry.data.data, entry.data.index == entry.data.size, entry.data);
        } else if (Meteor.isClient) {
            if (entry.data.permissionDenied) console.warn("Server denied permission on async callback");
            throwError(account, false);
        }
    });

    asyncServerFunctionChannel.emit('clientReady', connection.uuid);
}

/**
 * Object containing all information and functions for communication w/ the server.
 * @public
 * @namespace
 */
export let Server = {

    db: {
        /**
         * Returns the id of the server settings document.
         * @returns {string} The id
         */
        getGenericID: function () {
            return Meteor.COLLECTIONS.Generic.handle.find().fetch()[0]._id;
        },

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
            // TODO Replace w/ waterfall
            Meteor.COLLECTIONS.Generic.onReady(function () { //TODO automate for all collections
                Meteor.COLLECTIONS.Contests.onReady(function () {
                    Meteor.COLLECTIONS.Accounts.onReady(function () {
                        Meteor.COLLECTIONS.Athletes.onReady(function () {
                            callback();
                        });
                    });
                });
            });
        },
    },

    customAccounts: {
        store: function (account, contestID, customAccounts) {
            runServerFunction('storeCustomAccounts', account, {
                contestID: contestID,
                customAccounts: customAccounts
            });
        },
        retrieve: function (account, contestID) {
            return runServerFunction('retrieveCustomAccounts', account, {contestID: contestID});
        },
    },

    certificates: {
        /**
         * Updates a certificate of an athlete.
         * @param {Account} account - Output account
         * @param {boolean} id - The meteor db id of the athlete
         * @param [callback] - optional callback
         */
        update: function (account, id, callback) {
            runServerFunction('certificateUpdate', account, {id: id}, callback);
        },

        /**
         * Generates certificates for the current contest
         * @param {Account} account - Output account
         * @param {object[]} athleteIDs - List of athlete ids
         * @param [callback] - optional callback
         */
        generate: function (account, athleteIDs, callback) {
            runServerFunction('generateCertificates', account, {athleteIDs: athleteIDs}, callback);
        },
    },

    athletes: {
        count: function (account, contestID) {
            return runServerFunction('getAthleteCount', account, {contestID: contestID});
        },
        getAsync: function (account, contestID, require_signature, require_group_check, callback, doneCallback) {
            runAsyncServerFunction('getAthletes', account, {
                contestID: contestID,
                require_signature: require_signature,
                require_group_check: require_group_check
            }, callback, doneCallback);
        },

        /**
         *
         * @param {Log} log - A log object
         * @param {Account[]} accounts - The account
         * @param {boolean} require_signature - Only decrypt data if the signature can be verified. Should be true for final certificate creation.
         * @returns {Athlete[]}
         */
        getByAccounts: function (log, accounts, require_signature) {
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
    },

    contest: {
        /**
         * Returns the active contest object
         * @param [contestID] - ID of the contest to return
         * @returns {object}
         */
        get: function (contestID) {
            if (!contestID) contestID = Server.contest.getActiveID();
            return Meteor.COLLECTIONS.Contests.handle.findOne({_id: contestID});
        },
        add: function (account, name, contestType) {
            runServerFunction('addContest', account, {name: name, contestType: contestType});
        },
        lock: function (account, contestID, callback) {
            runServerFunction('lockContest', account, {contestID: contestID}, callback);
        },
        /**
         * Renames a contest with a given name
         * @param {Account} account - Admin account
         * @param {string} contestID - The id of the contest
         * @param {string} newName - The new name
         * @param [callback] - optional callback
         */
        rename: function (account, contestID, newName, callback) {
            runServerFunction('renameContest', account, {contestID: contestID, newName: newName}, callback);
        },
        /**
         * Removes a contest with a given name. The actual data are still in the db. Only the link is deleted.
         * @param {Account} account - Admin account
         * @param {string} contestID - The name of the contest
         * @param [callback] - optional callback
         */
        remove: function (account, contestID, callback) {
            runServerFunction('removeContest', account, {contestID: contestID}, callback);
        },
        /**
         * Activates a contest with a given name
         * @param {Account} account - Admin account
         * @param {string} contestID - The id of the contest
         * @param [callback] - optional callback
         */
        activate: function (account, contestID, callback) {
            runServerFunction('activateContest', account, {contestID: contestID}, callback);
        },
        /**
         * Returns the current or a given contest type
         * @param {Mongo.Collection} [contestID] - Handle of the db
         * @returns {object}
         */
        getType: function (contestID) {
            if (!contestID) contestID = Server.contest.getActiveID();
            return getContestTypeByID(Server.contest.get(contestID).type);
        },
        /**
         * Returns the active contest database ID
         * @returns {string}
         */
        getActiveID: function () {
            return Meteor.COLLECTIONS.Generic.handle.findOne({_id: Server.db.getGenericID()}).activeContest;
        },
    },

    /**
     * Set the state of a sportType for a given contest ID
     * @param account
     * @param contestID
     * @param sportTypeID
     * @param state
     * @param callback
     */
    setSportTypeState: function (account, contestID, sportTypeID, state, callback) {
        runServerFunction('setSportTypeState', account, {
            contestID: contestID,
            sportTypeID: sportTypeID,
            state: state
        }, callback);
    },

    // TODO: Replace this with a delta function
    writeAthletes: function (account, contestID, encryptedAthletes, callback) {
        runServerFunction('writeAthletes', account, {
            contestID: contestID,
            encryptedAthletes: encryptedAthletes
        }, callback);
    },

    // TODO: Replace this with a delta function
    writeAccounts: function (account, contestID, accounts, callback) {
        runServerFunction('writeAccounts', account, {contestID: contestID, accounts: accounts}, callback);
    },

    /**
     * Returns all ips of the server
     * @param {Account} account - Admin account
     * @param [callback] - optional callback
     */
    getIPs: function (account, callback) {
        runServerFunction('getServerIPs', account, {}, callback);
    },

    /**
     * Generates certificates for the current contest
     * @param {Account} account - Admin account
     * @param [callback] - optional callback
     */
    getLog: function (account, callback) {
        runServerFunction('getLog', account, {}, callback);
    }
};