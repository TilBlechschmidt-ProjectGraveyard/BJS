import {initCollections} from "../../api/database/collections/index";
import {DBInterface} from "../../api/database/db_access";
import {Account, checkLogin} from "../../api/logic/account";
import {Crypto} from "../../api/crypto/crypto";
import {encryptedAthletesToGroups} from "../../api/logic/athlete";
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
function checkAdminLogin(loginObject) {
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
    const adminAccount = new Account("Administrator", ['Q#z'], [], ac, true);
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
                Meteor.COLLECTIONS.Athletes.handles[competitionName].insert(encrypted_athletes[athlete]);
            }

            //write accounts
            for (let account in accounts) {
                Meteor.COLLECTIONS.Accounts.handles[competitionName].insert(accounts[account]);
            }

            //write general information
            Meteor.COLLECTIONS.Contest.handles[competitionName].insert({
                contestType: competitionTypeID,
                sportTypes: sportTypes
            });
            return encryptAsAdmin(true);
        },
        'getEditInformation': function (loginObject, competitionName) {
            if (!checkAdminLogin(loginObject)) return undefined;
            let listOFEditCompetitions = DBInterface.listEditCompetitions();
            if (listOFEditCompetitions.indexOf(competitionName) == -1) return undefined;

            // console.log(Meteor.COLLECTIONS.Contest.handles);
            const contestDBHandle = Meteor.COLLECTIONS.Contest.handles[competitionName];
            // console.log(contestDBHandle);

            const competitionTypeID = DBInterface.getCompetitionTypeID(contestDBHandle);
            const sportTypes = DBInterface.getActivatedSports(contestDBHandle);

            // console.log(Meteor.COLLECTIONS.Athletes.handles[competitionName]);
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
                // console.log(certificate);
                const stScores = [];

                for (let stID in certificate.stScores) {
                    stScores.push({
                        stID: stID,
                        name: ct.getNameOfSportType(stID),
                        score: certificate.stScores[stID]
                    });
                }

                return {
                    name: athlete.getFullName(),
                    valid: ct.validate(log, athlete, accounts, true),
                    score: certificate.score,
                    stScores: stScores,
                    certificate: certificate.certificate,
                    certificateName: certificate.certificate === 2 ? "Ehrenurkunde" : (certificate.certificate === 1 ? "Siegerurkunde" : (certificate.certificate === 0 ? "Teilnehmerurkunde" : "Fehler"))
                };
            };

            for (let groupGroupID in groups) {
                groups[groupGroupID].athletes = _.map(groups[groupGroupID].athletes, mapAthletet);
            }

            console.log(log.getAsString());

            return encryptAs(groups, account);
        }
    });

    // require('../../api/database/db_example')();
}