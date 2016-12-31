import {initCollections} from "../../api/database/collections/index";
import {DBInterface} from "../../api/database/db_access";

export function onStartup() {
    // Load the config.json into the (semi-global) Meteor.config object
    Meteor.config = require('../../../config.json');
    initCollections();

    if (Meteor.config.competitionMongoURL === "EQUAL") Meteor.config.competitionMongoURL = process.env.MONGO_URL.replace(/([^\/]*)$/, "");

    Meteor.methods({
        'activateCompetition': function (competitionName) {
            Meteor.COLLECTIONS.switch(competitionName);
        },
        'removeCompetition': function (competitionName) {
            console.log('remove ' + competitionName);
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
        },
        'writeCompetition': function (competitionName, competitionTypeID, sportTypes, encrypted_athletes, accounts, final) {

            // update index in Generic
            let listOFEditCompetitions = DBInterface.listEditCompetitions();
            console.log(listOFEditCompetitions);
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
                console.log(listOFCompetitions);
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
            console.log(competitionName);

            // create collections if they don't exist
            Meteor.COLLECTIONS.connect(competitionName);

            // clear collections
            Meteor.COLLECTIONS.Accounts.handles[competitionName].remove({});
            Meteor.COLLECTIONS.Athletes.handles[competitionName].remove({});
            Meteor.COLLECTIONS.Contest.handles[competitionName].remove({});

            // write data
            //write athletes
            console.log("insert athletes");
            for (let athlete in encrypted_athletes) {
                Meteor.COLLECTIONS.Athletes.handles[competitionName].insert(encrypted_athletes[athlete]);
            }

            //write accounts
            console.log("insert accounts");
            for (let account in accounts) {
                Meteor.COLLECTIONS.Accounts.handles[competitionName].insert(accounts[account]);
            }

            //write general information
            console.log("insert general");
            Meteor.COLLECTIONS.Contest.handles[competitionName].insert({
                contestType: competitionTypeID,
                sportTypes: sportTypes
            });
        },
        'getEditInformation': function (competitionName) {
            let listOFEditCompetitions = DBInterface.listEditCompetitions();
            if (listOFEditCompetitions.indexOf(competitionName) == -1) return undefined;

            console.log(competitionName);

            // console.log(Meteor.COLLECTIONS.Contest.handles);
            const contestDBHandle = Meteor.COLLECTIONS.Contest.handles[competitionName];
            // console.log(contestDBHandle);

            const competitionTypeID = DBInterface.getCompetitionTypeID(contestDBHandle);
            const sportTypes = DBInterface.getActivatedSports(contestDBHandle);

            console.log(competitionTypeID);
            console.log(sportTypes);
            // console.log(Meteor.COLLECTIONS.Athletes.handles[competitionName]);
            const encryptedAthletes = Meteor.COLLECTIONS.Athletes.handles[competitionName].find().fetch();

            return {
                competitionTypeID: competitionTypeID,
                sportTypes: sportTypes,
                encryptedAthletes: encryptedAthletes
            };
        }
    });

    // require('../../api/database/db_example')();
}