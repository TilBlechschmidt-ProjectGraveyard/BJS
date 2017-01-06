import {initCollections} from "../../api/database/collections/index";
import {DBInterface} from "../../api/database/db_access";
import {Account, checkLogin} from "../../api/logic/account";
import {Crypto} from "../../api/crypto/crypto";
import {encryptedAthletesToGroups, Athlete} from "../../api/logic/athlete";
import {Log} from "../../api/log";


/**
 * Returns the admin account.
 * @returns {Account}
 */
function getAdminAccount() {
    return Meteor.COLLECTIONS.Generic.handle.findOne().adminAccount;
}

/**
 *
 * @param {LoginObject} loginObject
 * @returns {boolean}
 */
function checkAdminLogin(loginObject) { //TODO check isAdmin member
    return checkLogin(getAdminAccount(), loginObject);
}

function encryptAsAdmin(data) {
    return Crypto.encrypt(data, getAdminAccount().ac, getAdminAccount().ac);
}

function encryptAs(data, account) {
    return Crypto.encrypt(data, account.ac, account.ac);
}

export function onStartup() {
    // Load the config.json into the (semi-global) Meteor.config object
    Meteor.config = require('../../../config.json');
    if (Meteor.config.competitionMongoURL === "EQUAL") Meteor.config.competitionMongoURL = process.env.MONGO_URL.replace(/([^\/]*)$/, "");

    initCollections();

    const ac = Crypto.generateAC(Meteor.config.adminPassword, Meteor.config.adminSalt);
    const adminAccount = new Account("Administrator", ['Q#z'], [], ac, true, true);
    Meteor.COLLECTIONS.Generic.handle.update(
        {_id: DBInterface.getGenericID()},
        {$set: {adminAccount: adminAccount}}
    );


    Meteor.methods({
        'activateCompetition': function (loginObject, competitionName) {
            if (!checkAdminLogin(loginObject)) return encryptAsAdmin(false);
            Meteor.COLLECTIONS.switch(competitionName);
            return encryptAsAdmin(true);
        },
        'removeCompetition': function (loginObject, competitionName) {
            if (!checkAdminLogin(loginObject)) return encryptAsAdmin(false);
            let listOFEditCompetitions = DBInterface.listEditCompetitions();
            let listOFCompetitions = DBInterface.listCompetitions();
            if (listOFEditCompetitions.indexOf(competitionName) != -1) {
                Meteor.COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {
                    $set: {
                        editContests: _.filter(listOFEditCompetitions, function (name) {
                            return name != competitionName;
                        })
                    }
                });
            } else if (listOFCompetitions.indexOf(competitionName) != -1) {
                Meteor.COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {
                    $set: {
                        contests: _.filter(listOFCompetitions, function (name) {
                            return name != competitionName;
                        })
                    }
                });
            }
            return encryptAsAdmin(true);
        },
        'writeCompetition': function (loginObject, competitionName, competitionTypeID, sportTypes, encrypted_athletes, accounts, final) {
            if (!checkAdminLogin(loginObject)) return encryptAsAdmin(false);
            // update index in Generic
            let listOFEditCompetitions = DBInterface.listEditCompetitions();
            if (final) {
                //remove from edit contest
                Meteor.COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {
                    $set: {
                        editContests: _.filter(listOFEditCompetitions, function (name) {
                            return name != competitionName;
                        })
                    }
                });

                let listOFCompetitions = DBInterface.listCompetitions();
                if (listOFCompetitions.indexOf(competitionName) == -1) {
                    listOFCompetitions.push(competitionName);
                    Meteor.COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {$set: {contests: listOFCompetitions}});
                }
            } else {
                if (listOFEditCompetitions.indexOf(competitionName) == -1) {
                    listOFEditCompetitions.push(competitionName);
                    Meteor.COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {$set: {editContests: listOFEditCompetitions}});
                }
            }

            // create collections if they don't exist
            Meteor.COLLECTIONS.connect(competitionName);

            // clear collections
            Meteor.COLLECTIONS.Accounts.handles[competitionName].remove({});
            Meteor.COLLECTIONS.Athletes.handles[competitionName].remove({});
            Meteor.COLLECTIONS.Contest.handles[competitionName].remove({});

            // write data
            //write athletes
            for (let athlete in encrypted_athletes) {
                if (!encrypted_athletes.hasOwnProperty(athlete)) continue;
                Meteor.COLLECTIONS.Athletes.handles[competitionName].insert(encrypted_athletes[athlete]);
            }

            //write accounts
            for (let account in accounts) {
                if (!accounts.hasOwnProperty(account)) continue;
                Meteor.COLLECTIONS.Accounts.handles[competitionName].insert(accounts[account]);
            }

            //write general information
            Meteor.COLLECTIONS.Contest.handles[competitionName].insert({
                contestType: competitionTypeID,
                sportTypes: sportTypes
            });

            if (final) {
                Meteor.call('activateCompetition', loginObject, competitionName);
            }

            return encryptAsAdmin(true);
        },
        'getEditInformation': function (loginObject, competitionName) {
            if (!checkAdminLogin(loginObject)) return undefined;
            let listOFEditCompetitions = DBInterface.listEditCompetitions();
            if (listOFEditCompetitions.indexOf(competitionName) == -1) return undefined;

            const contestDBHandle = Meteor.COLLECTIONS.Contest.handles[competitionName];

            const competitionTypeID = DBInterface.getCompetitionTypeID(contestDBHandle);
            const sportTypes = DBInterface.getActivatedSports(contestDBHandle);

            const encryptedAthletes = Meteor.COLLECTIONS.Athletes.handles[competitionName].find().fetch();

            return encryptAsAdmin({
                competitionTypeID: competitionTypeID,
                sportTypes: sportTypes,
                encryptedAthletes: encryptedAthletes
            });
        },
        'generateCertificates': function (loginObject) {
            const account = Meteor.COLLECTIONS.Accounts.handle.findOne({"ac.pubHash": loginObject.pubHash});

            if (!account) {
                return false;
            }
            if (!account.canViewResults) {
                return encryptAs(false, account);
            }

            const ct = DBInterface.getCompetitionType();
            const log = new Log();

            const accounts = Meteor.COLLECTIONS.Accounts.handle.find().fetch();
            const encryptedAthletes = Meteor.COLLECTIONS.Athletes.handle.find().fetch();

            const groups = encryptedAthletesToGroups(encryptedAthletes, accounts, true, true);

            let mapAthletet = function (athlete) {
                const certificate = ct.generateCertificate(log, athlete, accounts, true);
                const stScores = [];

                for (let stID in certificate.stScores) {
                    if (!certificate.stScores.hasOwnProperty(stID)) continue;
                    stScores.push({
                        stID: stID,
                        name: ct.getNameOfSportType(stID),
                        score: certificate.stScores[stID]
                    });
                }

                return {
                    name: athlete.getFullName(),
                    id: athlete.id,
                    certificateWritten: athlete.certificateScore === certificate.score,
                    certificateUpdate: (athlete.certificateScore >= 0) && (athlete.certificateScore !== certificate.score),
                    certificateTime: athlete.certificateTime,
                    certificatedBy: athlete.certificatedBy,
                    valid: ct.validate(log, athlete, accounts, true),
                    score: certificate.score,
                    stScores: stScores,
                    certificate: certificate.certificate,
                    certificateName: certificate.certificate === 2 ? "Ehrenurkunde" : (certificate.certificate === 1 ? "Siegerurkunde" : (certificate.certificate === 0 ? "Teilnehmerurkunde" : "Fehler"))
                };
            };

            for (let groupGroupID in groups) {
                if (!groups.hasOwnProperty(groupGroupID)) continue;
                groups[groupGroupID].athletes = _.map(groups[groupGroupID].athletes, mapAthletet);
            }

            return encryptAs(groups, account);
        },
        'getServerIPs': function () {
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
            const accounts = Meteor.COLLECTIONS.Accounts.handle.find().fetch();
            const athlete = Athlete.decryptFromDatabase(log, Meteor.COLLECTIONS.Athletes.handle.findOne({_id: id}), accounts, true, true);
            const ct = DBInterface.getCompetitionType();

            if (ct.validate(log, athlete, accounts, true)) {
                const certificate = ct.generateCertificate(log, athlete, accounts, true);
                Meteor.COLLECTIONS.Athletes.handle.update({_id: id}, {
                    $set: {
                        certificateTime: Date.now(),
                        certificateScore: certificate.score,
                        certificatedBy: account.name
                    }
                });
            }
        }
    });

    // require('../../api/database/db_example')();
}