import {initCollections} from "../../api/database/collections/index";
import {DBInterface} from "../../api/database/DBInterface";
import {Athlete, encryptedAthletesToGroups} from "../../api/logic/athlete";
import {Log} from "../../api/log";
import {encryptAsAdmin, encryptAs, getAdminAccount} from "./helpers";
import {Crypto} from "../../api/crypto/crypto";
import {filterUndefined} from "../../api/logic/general";
import {getCompetitionTypeByID} from "../../api/logic/competition_type";


export function onStartup() {
    // Load the config.json into the (semi-global) Meteor.config object
    Meteor.config = require('../../../config.json');
    if (Meteor.config.competitionMongoURL === "EQUAL") Meteor.config.competitionMongoURL = process.env.MONGO_URL.replace(/([^\/]*)$/, "");

    initCollections();

    console.log('Your utmost secure and highly trustworthy administrator password reads "'.italic.lightCyan + Meteor.COLLECTIONS.Generic.handle.findOne({_id: DBInterface.getGenericID()}).adminPassword.bold.lightRed.underline + '".'.italic.lightCyan);
    console.log("Remember that with great power comes great responsibility, so you shall use it wisely!".italic.lightCyan);
    console.log("Now go, use all that voodoo power that comes with it and do some good to your people.".italic.lightCyan);

    const serverFunctions = {
        /**
         * Activates a competition by id
         * @param {Account} account - An admin account
         * @param {{competitionID: string}} data - Data object
         * @returns {boolean}
         */
        activateCompetition: function (account, data) {
            if (!account.isAdmin) return false;
            Meteor.COLLECTIONS.switch(data.competitionID);
            return true;
        },
        /**
         * Removes a competition by id
         * @param {Account} account - An admin account
         * @param {{competitionID: string}} data - Data object
         * @returns {boolean}
         */
        removeCompetition: function (account, data) {
            if (!account.isAdmin) return false;
            Meteor.COLLECTIONS.Contests.handle.remove({_id: data.competitionID});
            return true;
        },
        /**
         * Overwrites the athletes of a competition
         * @param {Account} account - An admin account
         * @param {{competitionID: string, encryptedAthletes: []}} data - Data object
         * @returns {boolean}
         */
        writeAthletes: function (account, data) {
            if (!account.isAdmin) return false;

            // create collections if they don't exist
            Meteor.COLLECTIONS.connect(data.competitionID);

            // clear collections
            Meteor.COLLECTIONS.Athletes.handles[data.competitionID].remove({});

            //write athletes
            for (let athlete in data.encryptedAthletes) {
                if (!data.encryptedAthletes.hasOwnProperty(athlete)) continue;
                Meteor.COLLECTIONS.Athletes.handles[data.competitionID].insert(data.encryptedAthletes[athlete]);
            }

            return true;
        },
        /**
         * Overwrites the athletes of a competition
         * @param {Account} account - An admin account
         * @param {{competitionID: string, accounts: []}} data - Data object
         * @returns {boolean}
         */
        writeAccounts: function (account, data) {
            if (!account.isAdmin) return false;

            // create collections if they don't exist
            Meteor.COLLECTIONS.connect(data.competitionID);

            // clear collections
            Meteor.COLLECTIONS.Accounts.handles[data.competitionID].remove({});

            //write accounts
            for (let account in data.accounts) {
                if (!data.accounts.hasOwnProperty(account)) continue;
                Meteor.COLLECTIONS.Accounts.handles[data.competitionID].insert(data.accounts[account]);
            }

            return true;
        },
        /**
         * Locks a competition
         * @param {Account} account - An admin account
         * @param {{competitionID: string}} data - Data object
         * @returns {boolean}
         */
        lockCompetition: function (account, data) {
            if (!account.isAdmin) return false;

            Meteor.COLLECTIONS.Contests.handle.update({_id: data.competitionID}, {
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
         * Adds a competition
         * @param {Account} account - An admin account
         * @param {{name: string, competitionType: number}} data - Data object
         * @returns {boolean}
         */
        addCompetition: function (account, data) {
            if (!account.isAdmin) return false;

            const competitionType = getCompetitionTypeByID(data.competitionType);
            const sportTypes = lodash.map(competitionType.getSports(), function (ct) {
                return ct.id;
            });

            const _id = Meteor.COLLECTIONS.Contests.handle.insert({
                name: data.name,
                sportTypes: sportTypes,
                readOnly: false,
                type: data.competitionType,
                customAccounts: []
            });
            Meteor.COLLECTIONS.connect(_id);

            return true;
        },
        /**
         * Renames a competition
         * @param {Account} account - An admin account
         * @param {{competitionID: string, newName: string}} data - Data object
         * @returns {boolean}
         */
        renameCompetition: function (account, data) {
            if (!account.isAdmin) return false;
            Meteor.COLLECTIONS.Contests.handle.update({_id: data.competitionID}, {
                $set: {name: data.newName}
            });
            return true;
        },

        /**
         * Adds a competition
         * @param {Account} account - An admin account
         * @param {{competitionID: string, sportTypeID: string, state}} data - Data object
         * @returns {boolean}
         */
        setSportTypeState: function (account, data) {
            if (!account.isAdmin) return false;
            let sportTypes = Meteor.COLLECTIONS.Contests.handle.findOne({_id: data.competitionID}).sportTypes;

            if (data.state === true && !lodash.includes(sportTypes, data.sportTypeID)) {
                sportTypes.push(data.sportTypeID);
            } else if (data.state === false) {
                lodash.remove(sportTypes, function (stID) {
                    return stID === data.sportTypeID
                });
            }

            Meteor.COLLECTIONS.Contests.handle.update({_id: data.competitionID}, {
                $set: {sportTypes: sportTypes}
            });

            return true;
        },
        /**
         * Returns a list of competitions
         * @param {Account} account - An admin account
         * @param {{}} data - Data object
         * @returns {boolean|[]}
         */
        getCompetitions: function (account, data) {
            if (!account.isAdmin) return false;
            let competitions = Meteor.COLLECTIONS.Contests.find().fetch();

            lodash.map(competitions, function (competition) {
                competition.encryptedAthletes = Meteor.COLLECTIONS.Athletes.handles[competition._id].find().fetch();
                return competition;
            });

            return competitions;
        },
        /**
         * Adds a competition
         * @param {Account} account - An admin account
         * @param {{competitionID: string, require_signature: boolean, require_group_check: boolean}} data - Data object
         * @returns {boolean|[]}
         */
        getAthletesByCompetitionID: function (account, data) {
            if (!account.isAdmin) return false;
            const accounts = Meteor.COLLECTIONS.Accounts.handles[data.competitionID].find().fetch().concat([getAdminAccount()]);
            const encryptedAthletes = Meteor.COLLECTIONS.Athletes.handles[data.competitionID].find().fetch();

            return encryptedAthletesToGroups(encryptedAthletes, accounts, data.require_signature, data.require_group_check);
        },
        /**
         * Gets the amount of athletes in a competition
         * @param {Account} account - An admin account
         * @param {{competitionID: string}} data - Data object
         * @returns {boolean}
         */
        getAthleteCount: function (account, data) {
            if (!account.isAdmin) return false;
            return Meteor.COLLECTIONS.Athletes.handles[data.competitionID].find({}).count();
        },
        /**
         * Stores a set of custom accounts in the database for later retrieval
         * @param account - An admin account
         * @param {{competitionID: string, customAccounts: Array}} data - Data object
         * @returns {boolean}
         */
        storeCustomAccounts: function (account, data) {
            if (!account.isAdmin) return false;
            Meteor.COLLECTIONS.Contests.handle.update({_id: data.competitionID}, {
                $set: {customAccounts: data.customAccounts}
            });
            return true;
        },
        /**
         * Retrieves a previously stored set of custom accounts
         * @param account - An admin account
         * @param {{competitionID: string}} data - Data object
         * @returns {*}
         */
        retrieveCustomAccounts: function (account, data) {
            if (!account.isAdmin) return false;
            return Meteor.COLLECTIONS.Contests.handle.findOne({_id: data.competitionID}).customAccounts || [];
        },
        /**
         * Adds a competition
         * @param {Account} account - An output account
         * @param {{athleteIDs: [string]}} data - Data object
         * @returns {boolean|[]}
         */
        generateCertificates: function (account, data) {
            if (!account.canViewResults) return false;

            const ct = DBInterface.getCompetitionType();
            const log = new Log();

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
         * @returns {boolean|[]}
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
         * Sets the written status of a certificate to true
         * @param {Account} account - An output account
         * @param {{id: string}} data - Data object
         * @returns {boolean|[]}
         */
        certificateUpdate: function (account, data) {
            if (!account.canViewResults) return false;

            const log = new Log();
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

            const log = new Log();
            const data = Crypto.tryDecrypt(log, enc_data, [account.ac]);

            return encryptAs(serverFunctions[name](account, data.data), account);
        }
    });

    // require('../../api/database/db_example')();
}