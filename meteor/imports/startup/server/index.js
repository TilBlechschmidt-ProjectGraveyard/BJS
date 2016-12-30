export function onStartup() {
    // Load the config.json into the (semi-global) Meteor.config object
    Meteor.config = require('../../../config.json');

    if (Meteor.config.competitionMongoURL === "EQUAL") Meteor.config.competitionMongoURL = process.env.MONGO_URL.replace(/([^\/]*)$/, "");

    const COLLECTIONS = require('../../api/database/collections')();

    Meteor.methods({
        'activateCompetition': function (competitionName) {
            import {DBInterface} from "../../api/database/db_access";
            COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {$set: {activeContest: competitionName}});
            COLLECTIONS.Accounts.select(competitionName);
            COLLECTIONS.Athletes.select(competitionName);
            COLLECTIONS.Contest.select(competitionName);
        },
        'createCompetition': function (competitionName, competitionTypeID, sportTypes, encrypted_athletes, accounts) {
            console.log("creationg new competition");

            import {DBInterface} from "../../api/database/db_access";
            import {Collection} from "../../api/database/collections/collection";

            const dbPrefix = competitionName.replace(/ /g, '') + '_';

            COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {$set: {activeContest: competitionName}});
            COLLECTIONS.Accounts.connect(competitionName);
            COLLECTIONS.Athletes.connect(competitionName);
            COLLECTIONS.Contest.connect(competitionName);
            COLLECTIONS.Accounts.select(competitionName);
            COLLECTIONS.Athletes.select(competitionName);
            COLLECTIONS.Contest.select(competitionName);

            console.log("insert athletes");
            for (let athlete in encrypted_athletes) {
                COLLECTIONS.Athletes.handle.insert(encrypted_athletes[athlete]);
            }

            console.log("insert accounts");
            for (let account in accounts) {
                COLLECTIONS.Accounts.handle.insert(accounts[account]);
            }

            console.log("insert general");
            COLLECTIONS.Contest.handle.insert({
                contestType: competitionTypeID,
                sportTypes: sportTypes
            });

            let listOFCompetitions = DBInterface.listCompetition();
            listOFCompetitions.push(competitionName);
            COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {$set: {contests: listOFCompetitions}});
        }
    });

    // require('../../api/database/db_example')();
}