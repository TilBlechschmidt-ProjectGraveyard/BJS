import {initCollections} from "../../api/database/collections/index";
import {DBInterface} from "../../api/database/DBInterface";
import {Athlete, encryptedAthletesToGroups} from "../../api/logic/athlete";
import {Log} from "../../api/log";
import {checkAdminLogin, encryptAsAdmin, encryptAs, getAdminAccount} from "./helpers";
import {Crypto} from "../../api/crypto/crypto";
import {filterUndefined} from "../../api/logic/general";


export function onStartup() {
    // Load the config.json into the (semi-global) Meteor.config object
    Meteor.config = require('../../../config.json');
    if (Meteor.config.competitionMongoURL === "EQUAL") Meteor.config.competitionMongoURL = process.env.MONGO_URL.replace(/([^\/]*)$/, "");

    initCollections();

    Meteor.methods({
        'activateCompetition': function (loginObject, competitionID) {
            if (!checkAdminLogin(loginObject)) return encryptAsAdmin(false);
            Meteor.COLLECTIONS.switch(competitionID);
            return encryptAsAdmin(true);
        },
        'removeCompetition': function (loginObject, competitionID) {
            if (!checkAdminLogin(loginObject)) return encryptAsAdmin(false);
            Meteor.COLLECTIONS.Contests.handle.remove({_id: competitionID});
            return encryptAsAdmin(true);
        },
        'writeAthletes': function (loginObject, competitionID, encryptedAthletes) {
            if (!checkAdminLogin(loginObject)) return encryptAsAdmin(false);

            // create collections if they don't exist
            Meteor.COLLECTIONS.connect(competitionID);

            // clear collections
            Meteor.COLLECTIONS.Athletes.handles[competitionID].remove({});

            //write athletes
            for (let athlete in encryptedAthletes) {
                if (!encryptedAthletes.hasOwnProperty(athlete)) continue;
                Meteor.COLLECTIONS.Athletes.handles[competitionID].insert(encryptedAthletes[athlete]);
            }

            return encryptAsAdmin(true);
        },
        'writeAccounts': function (loginObject, competitionID, accounts) {
            if (!checkAdminLogin(loginObject)) return encryptAsAdmin(false);

            // create collections if they don't exist
            Meteor.COLLECTIONS.connect(competitionID);

            // clear collections
            Meteor.COLLECTIONS.Accounts.handles[competitionID].remove({});

            //write accounts
            for (let account in accounts) {
                if (!accounts.hasOwnProperty(account)) continue;
                Meteor.COLLECTIONS.Accounts.handles[competitionID].insert(accounts[account]);
            }

            return encryptAsAdmin(true);
        },
        'lockCompetition': function (loginObject, competitionID) {
            if (!checkAdminLogin(loginObject)) return encryptAsAdmin(false);
            Meteor.COLLECTIONS.Contests.handle.update({_id: competitionID}, {
                $set: {readOnly: true}
            });

            return encryptAsAdmin(true);
        },
        'addCompetition': function (loginObject, name, competitionType) {
            if (!checkAdminLogin(loginObject)) return encryptAsAdmin(false);
            Meteor.COLLECTIONS.Contests.handle.insert({
                name: name,
                sportTypes: [],
                readOnly: false,
                type: competitionType
            });

            return encryptAsAdmin(true);
        },
        'setSportTypeState': function (loginObject, competitionID, sportTypeID, state) {
            if (!checkAdminLogin(loginObject)) return encryptAsAdmin(false);
            let sportTypes = Meteor.COLLECTIONS.Contests.handle.findOne({_id: competitionID}).sportTypes;

            if (state === true && !lodash.includes(sportTypes, sportTypeID)) {
                sportTypes.push(sportTypeID);
            } else if (state === false) {
                lodash.remove(sportTypes, function (stID) {
                    return stID !== sportTypeID
                });
            }

            Meteor.COLLECTIONS.Contests.handle.update({_id: competitionID}, {
                $set: {sportTypes: sportTypes}
            });

            return encryptAsAdmin(true);
        },
        'getCompetitions': function (loginObject) {
            if (!checkAdminLogin(loginObject)) return undefined;
            let competitions = Meteor.COLLECTIONS.Contests.find().fetch();

            lodash.map(competitions, function (competition) {
                competition.encryptedAthletes = Meteor.COLLECTIONS.Athletes.handles[competition._id].find().fetch();
                return competition;
            });

            return encryptAsAdmin(competitions);
        },
        'getAthletesByCompetitionID': function (loginObject, competitionID) {
            if (!checkAdminLogin(loginObject)) return undefined;

            const accounts = Meteor.COLLECTIONS.Accounts.handles[competitionID].find().fetch();
            const encryptedAthletes = Meteor.COLLECTIONS.Athletes.handles[competitionID].find().fetch();

            const groups = encryptedAthletesToGroups(encryptedAthletes, accounts, true, true);

            return encryptAsAdmin(groups);
        },
        'generateCertificates': function (loginObject, athleteIDs) {
            let account = Meteor.COLLECTIONS.Accounts.handle.findOne({"ac.pubHash": loginObject.pubHash});

            if (!account) {
                const adminAccount = getAdminAccount();
                if (loginObject.pubHash === adminAccount.ac.pubHash) {
                    account = adminAccount;
                } else {
                    return false;
                }
            }
            if (!account.canViewResults) {
                return encryptAs(false, account);
            }

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

            return encryptAs(filterUndefined(_.map(athleteIDs, mapAthletet)), account);
        },
        'getServerIPs': function (event) {
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
        'certificateUpdate': function (loginObject, id) {
            const account = Meteor.COLLECTIONS.Accounts.handle.findOne({"ac.pubHash": loginObject.pubHash});

            if (!account) {
                return false;
            }
            if (!account.canViewResults) {
                return encryptAs(false, account);
            }

            const log = new Log();
            const athlete = Meteor.COLLECTIONS.Athletes.handle.findOne({_id: id});
            const validityObject = Crypto.tryDecrypt(log, athlete.certificateValid, [getAdminAccount().ac]);

            if (validityObject && validityObject.signatureEnforced && validityObject.data) {
                Meteor.COLLECTIONS.Athletes.handle.update({_id: id}, {
                    $set: {
                        certificateTime: encryptAsAdmin(Date.now()),
                        certificateScore: athlete.currentScore,
                        certificatedBy: encryptAsAdmin(account.name)
                    }
                });
                return encryptAs(true, account);
            }
            return encryptAs(false, account);
        }
    });

    // require('../../api/database/db_example')();
}