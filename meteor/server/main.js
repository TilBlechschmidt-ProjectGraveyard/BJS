import {initCollections} from "../imports/api/database/collections/index";
import {Server} from "../imports/api/database/ServerInterface";
import {Athlete, encryptedAthletesToGroups} from "../imports/api/logic/athlete";
import {Log} from "../imports/api/log";
import {encryptAsAdmin, encryptAs, getAdminAccount} from "./helpers";
import {Crypto} from "../imports/api/crypto/crypto";
import {filterUndefined} from "../imports/api/logic/general";
import {getContestTypeByID} from "../imports/api/logic/contestType";
import {genUUID} from "../imports/api/crypto/pwdgen";
import {asyncServerFunctionChannel} from "../imports/api/streamer";
const waterfall = require('async-waterfall');

Meteor.startup(function () {
    // Load the config.json into the (semi-global) Meteor.config object
    Meteor.config = require('../config.json');
    if (Meteor.config.contestMongoURL === "EQUAL") Meteor.config.contestMongoURL = process.env.MONGO_URL.replace(/([^\/]*)$/, "");

    initCollections();

    console.log('Your utmost secure and highly trustworthy administrator password reads "'.italic.lightCyan + Meteor.COLLECTIONS.Generic.handle.findOne({_id: Server.db.getGenericID()}).adminPassword.bold.lightRed.underline + '".'.italic.lightCyan);
    console.log("Remember that with great power comes great responsibility, so you shall use it wisely!".italic.lightCyan);
    console.log("Now go, use all that voodoo power that comes with it and do some good to your people.".italic.lightCyan);

    asyncServerFunctionChannel.allowRead('all');
    asyncServerFunctionChannel.allowWrite('all');

    const asyncServerFunctions = {
        getAthletes: function (account, data) {
            const accounts = Meteor.COLLECTIONS.Accounts.handles[data.contestID].find().fetch().concat([getAdminAccount()]);
            const encryptedAthletes = Meteor.COLLECTIONS.Athletes.handles[data.contestID].find().fetch();
            const log = Log.getLogObject();

            // Return false to deny permission
            return {
                entries: encryptedAthletes,
                callback: function (encryptedAthlete) {
                    return Athlete.decryptFromDatabase(log, encryptedAthlete, accounts, data.require_signature, data.require_group_check);
                }
            }
        }
    };

    // Wait for the client to be ready
    const pendingAsyncCalls = new ReactiveVar({});

    asyncServerFunctionChannel.on('clientReady', function (id) {
        const pendingCalls = pendingAsyncCalls.get();
        if (typeof pendingCalls[id] === 'function') {
            const call = pendingCalls[id];

            delete pendingCalls[id];
            pendingAsyncCalls.set(pendingCalls);

            call();
        } else {
            console.error("Got asyncReady event but there was no pending call");
        }
    });

    const serverFunctions = {
        runAsync: function (account, data) {
            const context = asyncServerFunctions[data.name](account, data.data);
            const uuid = genUUID();
            const size = context.entries.length - 1;

            if (context === false)
                return {
                    uuid: "",
                    permissionDenied: true
                };

            const pendingCalls = pendingAsyncCalls.get();
            pendingCalls[uuid] = function () {
                let index = 0;
                waterfall(context.entries.map(function (entry) {
                    return function (nextCallback) {
                        asyncServerFunctionChannel.emit(uuid, encryptAs({
                            index: index,
                            size: size,
                            data: context.callback(entry)
                        }, account));

                        ++index;
                        nextCallback(null);
                    }
                }));
            };
            pendingAsyncCalls.set(pendingCalls);

            return {
                uuid: uuid,
                size: size
            }
        },
        /**
         * Activates a contest by id
         * @param {Account} account - An admin account
         * @param {{contestID: string}} data - Data object
         * @returns {boolean}
         */
        activateContest: function (account, data) {
            if (!account.isAdmin) return false;
            Meteor.COLLECTIONS.switch(data.contestID);
            return true;
        },
        /**
         * Removes a contest by id
         * @param {Account} account - An admin account
         * @param {{contestID: string}} data - Data object
         * @returns {boolean}
         */
        removeContest: function (account, data) {
            if (!account.isAdmin) return false;
            Meteor.COLLECTIONS.Contests.handle.remove({_id: data.contestID});
            return true;
        },

        /**
         * @typedef {Object} WriteAthletesDataObject
         * @property {string} contestID - The id of the contest
         * @property {object[]} encryptedAthletes - The encrypted athletes
         */

        /**
         * Overwrites the athletes of a contest
         * @param {Account} account - An admin account
         * @param {WriteAthletesDataObject} data - Data object
         * @returns {boolean}
         */
        writeAthletes: function (account, data) {
            if (!account.isAdmin) return false;

            // create collections if they don't exist
            Meteor.COLLECTIONS.connect(data.contestID);

            // clear collections
            Meteor.COLLECTIONS.Athletes.handles[data.contestID].remove({});

            //write athletes
            for (let athlete in data.encryptedAthletes) {
                if (!data.encryptedAthletes.hasOwnProperty(athlete)) continue;
                Meteor.COLLECTIONS.Athletes.handles[data.contestID].insert(data.encryptedAthletes[athlete]);
            }

            return true;
        },
        /**
         * Overwrites the athletes of a contest
         * @param {Account} account - An admin account
         * @param {{contestID: string, accounts: object[]}} data - Data object
         * @returns {boolean}
         */
        writeAccounts: function (account, data) {
            if (!account.isAdmin) return false;

            // create collections if they don't exist
            Meteor.COLLECTIONS.connect(data.contestID);

            // clear collections
            Meteor.COLLECTIONS.Accounts.handles[data.contestID].remove({});

            //write accounts
            for (let account in data.accounts) {
                if (!data.accounts.hasOwnProperty(account)) continue;
                Meteor.COLLECTIONS.Accounts.handles[data.contestID].insert(data.accounts[account]);
            }

            return true;
        },
        /**
         * Locks a contest
         * @param {Account} account - An admin account
         * @param {{contestID: string}} data - Data object
         * @returns {boolean}
         */
        lockContest: function (account, data) {
            if (!account.isAdmin) return false;

            Meteor.COLLECTIONS.Contests.handle.update({_id: data.contestID}, {
                $set: {
                    readOnly: true
                },
                $unset: {
                    customAccounts: 1
                }
            });

            return true;
        },
        /**
         * Adds a contest
         * @param {Account} account - An admin account
         * @param {{name: string, contestType: number}} data - Data object
         * @returns {boolean}
         */
        addContest: function (account, data) {
            if (!account.isAdmin) return false;

            const contestType = getContestTypeByID(data.contestType);
            const sportTypes = lodash.map(contestType.getSports(), function (ct) {
                return ct.id;
            });

            const _id = Meteor.COLLECTIONS.Contests.handle.insert({
                name: data.name,
                sportTypes: sportTypes,
                readOnly: false,
                type: data.contestType,
                customAccounts: []
            });
            Meteor.COLLECTIONS.connect(_id);

            return true;
        },
        /**
         * Renames a contest
         * @param {Account} account - An admin account
         * @param {{contestID: string, newName: string}} data - Data object
         * @returns {boolean}
         */
        renameContest: function (account, data) {
            if (!account.isAdmin) return false;
            Meteor.COLLECTIONS.Contests.handle.update({_id: data.contestID}, {
                $set: {name: data.newName}
            });
            return true;
        },

        /**
         * Adds a contest
         * @param {Account} account - An admin account
         * @param {{contestID: string, sportTypeID: string, state}} data - Data object
         * @returns {boolean}
         */
        setSportTypeState: function (account, data) {
            if (!account.isAdmin) return false;
            let sportTypes = Meteor.COLLECTIONS.Contests.handle.findOne({_id: data.contestID}).sportTypes;

            if (data.state === true && !lodash.includes(sportTypes, data.sportTypeID)) {
                sportTypes.push(data.sportTypeID);
            } else if (data.state === false) {
                lodash.remove(sportTypes, function (stID) {
                    return stID === data.sportTypeID
                });
            }

            Meteor.COLLECTIONS.Contests.handle.update({_id: data.contestID}, {
                $set: {sportTypes: sportTypes}
            });

            return true;
        },
        /**
         * Returns a list of contests
         * @param {Account} account - An admin account
         * @param {{}} data - Data object
         * @returns {boolean|object[]}
         */
        getContests: function (account, data) {
            if (!account.isAdmin) return false;
            let contests = Meteor.COLLECTIONS.Contests.find().fetch();

            lodash.map(contests, function (contest) {
                contest.encryptedAthletes = Meteor.COLLECTIONS.Athletes.handles[contest._id].find().fetch();
                return contest;
            });

            return contests;
        },
        /**
         * Adds a contest
         * @param {Account} account - An admin account
         * @param {{contestID: string, require_signature: boolean, require_group_check: boolean}} data - Data object
         * @returns {boolean|object[]}
         */
        getAthletesByContestID: function (account, data) {
            if (!account.isAdmin) return false;
            const accounts = Meteor.COLLECTIONS.Accounts.handles[data.contestID].find().fetch().concat([getAdminAccount()]);
            const encryptedAthletes = Meteor.COLLECTIONS.Athletes.handles[data.contestID].find().fetch();

            return encryptedAthletesToGroups(encryptedAthletes, accounts, data.require_signature, data.require_group_check);
        },
        /**
         * Gets the amount of athletes in a contest
         * @param {Account} account - An admin account
         * @param {{contestID: string}} data - Data object
         * @returns {boolean}
         */
        getAthleteCount: function (account, data) {
            if (!account.isAdmin) return false;
            return Meteor.COLLECTIONS.Athletes.handles[data.contestID].find({}).count();
        },
        /**
         * Stores a set of custom accounts in the database for later retrieval
         * @param account - An admin account
         * @param {{contestID: string, customAccounts: Array}} data - Data object
         * @returns {boolean}
         */
        storeCustomAccounts: function (account, data) {
            if (!account.isAdmin) return false;
            Meteor.COLLECTIONS.Contests.handle.update({_id: data.contestID}, {
                $set: {customAccounts: data.customAccounts}
            });
            return true;
        },
        /**
         * Retrieves a previously stored set of custom accounts
         * @param account - An admin account
         * @param {{contestID: string}} data - Data object
         * @returns {*}
         */
        retrieveCustomAccounts: function (account, data) {
            if (!account.isAdmin) return false;
            return Meteor.COLLECTIONS.Contests.handle.findOne({_id: data.contestID}).customAccounts || [];
        },
        /**
         * Adds a contest
         * @param {Account} account - An output account
         * @param {{athleteIDs: string[]}} data - Data object
         * @returns {boolean|object[]}
         */
        generateCertificates: function (account, data) {
            if (!account.canViewResults) return false;

            const ct = Server.contest.getType();
            const log = Log.getLogObject();

            log.info("Die Urkunden wurden von '" + account.name + "' generiert.");

            const accounts = Meteor.COLLECTIONS.Accounts.handle.find().fetch();

            let mapAthletet = function (athleteID) {
                const encryptedAthlete = Meteor.COLLECTIONS.Athletes.handle.findOne({_id: athleteID});
                const athlete = Athlete.decryptFromDatabase(log, encryptedAthlete, accounts, true);
                const currentScoreObject = Crypto.tryDecrypt(log, athlete.currentScore, [getAdminAccount().ac]);
                const stScoresObject = Crypto.tryDecrypt(log, athlete.stScores, [getAdminAccount().ac]);
                const certificateObject = Crypto.tryDecrypt(log, athlete.certificate, [getAdminAccount().ac]);
                const certificateScoreObject = Crypto.tryDecrypt(log, athlete.certificateScore, [getAdminAccount().ac]);
                const certificateTimeObject = Crypto.tryDecrypt(log, athlete.certificateTime, [getAdminAccount().ac]);
                const certificatedByObject = Crypto.tryDecrypt(log, athlete.certificatedBy, [getAdminAccount().ac]);
                const validObject = Crypto.tryDecrypt(log, athlete.certificateValid, [getAdminAccount().ac]);

                if (!(currentScoreObject && currentScoreObject.signatureEnforced &&
                    stScoresObject && stScoresObject.signatureEnforced &&
                    certificateObject && certificateObject.signatureEnforced &&
                    certificateScoreObject && certificateScoreObject.signatureEnforced &&
                    certificateTimeObject && certificateTimeObject.signatureEnforced &&
                    certificatedByObject && certificatedByObject.signatureEnforced &&
                    validObject && validObject.signatureEnforced)) return undefined;

                const stScores = [];

                for (let stID in stScoresObject.data) {
                    if (!stScoresObject.data.hasOwnProperty(stID)) continue;
                    stScores.push({
                        stID: stID,
                        name: ct.getNameOfSportType(stID),
                        score: stScoresObject.data[stID]
                    });
                }

                return {
                    name: athlete.getFullName(),
                    firstName: athlete.firstName,
                    lastName: athlete.lastName,
                    group: athlete.group,
                    isMale: athlete.isMale,
                    ageGroup: athlete.ageGroup,
                    handicap: athlete.handicap,
                    id: athlete.id,
                    certificateWritten: currentScoreObject.data === certificateScoreObject.data && certificateScoreObject.data > 0,
                    certificateUpdate: (certificateScoreObject.data > 0) && (certificateScoreObject.data !== currentScoreObject.data),
                    certificateTime: certificateTimeObject.data,
                    certificatedBy: certificatedByObject.data,
                    valid: validObject.data,
                    score: currentScoreObject.data,
                    stScores: stScores,
                    certificate: certificateObject.data,
                    certificateName: certificateObject.data === 2 ? "Ehrenurkunde" : (certificateObject.data === 1 ? "Siegerurkunde" : (certificateObject.data === 0 ? "Teilnehmerurkunde" : "Fehler"))
                };
            };

            return filterUndefined(_.map(data.athleteIDs, mapAthletet));
        },
        /**
         * Returns all ips of the server
         * @param {Account} account - An admin account
         * @param {{}} data - Data object
         * @returns {boolean|object[]}
         */
        getServerIPs: function (account, data) {
            if (!account.isAdmin) return false;


            const os = require('os');
            const ifaces = os.networkInterfaces();
            const ips = [];

            Object.keys(ifaces).forEach(function (ifname) {
                ifaces[ifname].forEach(function (iface) {
                    if ('IPv4' !== iface.family || iface.internal !== false) {
                        return;
                    }
                    ips.push(iface.address);
                });
            });
            return ips;
        },

        /**
         * Returns the server log
         * @param {Account} account - An admin account
         * @param {{}} data - Data object
         * @returns {boolean|object[]}
         */
        getLog: function (account, data) {
            if (!account.isAdmin) return false;
            return Log.getLogObject().messages;
        },

        /**
         * Sets the written status of a certificate to true
         * @param {Account} account - An output account
         * @param {{id: string}} data - Data object
         * @returns {boolean|object[]}
         */
        certificateUpdate: function (account, data) {
            if (!account.canViewResults) return false;

            const log = Log.getLogObject();
            const athlete = Meteor.COLLECTIONS.Athletes.handle.findOne({_id: data.id});
            const validityObject = Crypto.tryDecrypt(log, athlete.certificateValid, [getAdminAccount().ac]);

            if (validityObject && validityObject.signatureEnforced && validityObject.data) {
                Meteor.COLLECTIONS.Athletes.handle.update({_id: data.id}, {
                    $set: {
                        certificateTime: encryptAsAdmin(Date.now()),
                        certificateScore: athlete.currentScore,
                        certificatedBy: encryptAsAdmin(account.name)
                    }
                });
                log.info("Die Urkunde von '" + athlete.firstName + " " + athlete.firstName + "' wurden von '" + athlete.name + "' fertiggestellt.");
                return true;
            }
            return false;
        }
    };


    Meteor.methods({
        'runServerFunction': function (name, loginObject, enc_data) {
            //find account
            let account = Meteor.COLLECTIONS.Accounts.handle.findOne({"ac.pubHash": loginObject.pubHash});

            // check admin account
            if (!account) {
                const adminAccount = getAdminAccount();
                if (loginObject.pubHash === adminAccount.ac.pubHash) {
                    account = adminAccount;
                }
            }

            if (!account) {
                return false;
            }

            const log = Log.getLogObject();
            const data = Crypto.tryDecrypt(log, enc_data, [account.ac]);

            const res = serverFunctions[name](account, data.data);
            return encryptAs(res, account);
        }
    });
});