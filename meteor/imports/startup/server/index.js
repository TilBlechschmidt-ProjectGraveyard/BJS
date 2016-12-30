import {DBInterface} from "../../api/database/db_access";
import {initCollections} from "../../api/database/collections/index";

export function onStartup() {
    // Load the config.json into the (semi-global) Meteor.config object
    Meteor.config = require('../../../config.json');
    initCollections();

    if (Meteor.config.competitionMongoURL === "EQUAL") Meteor.config.competitionMongoURL = process.env.MONGO_URL.replace(/([^\/]*)$/, "");

    Meteor.methods({
        'activateCompetition': function (competitionName) {
            import {DBInterface} from "../../api/database/db_access";
            Meteor.COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {$set: {activeContest: competitionName}});
            Meteor.COLLECTIONS.Accounts.select(competitionName);
            Meteor.COLLECTIONS.Athletes.select(competitionName);
            Meteor.COLLECTIONS.Contest.select(competitionName);
        },
        'createCompetition': function (competitionName, competitionTypeID, sportTypes, encrypted_athletes, accounts) {
            console.log("creationg new competition");


            Meteor.COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {$set: {activeContest: competitionName}});
            Meteor.COLLECTIONS.Accounts.connect(competitionName);
            Meteor.COLLECTIONS.Athletes.connect(competitionName);
            Meteor.COLLECTIONS.Contest.connect(competitionName);
            Meteor.COLLECTIONS.Accounts.select(competitionName);
            Meteor.COLLECTIONS.Athletes.select(competitionName);
            Meteor.COLLECTIONS.Contest.select(competitionName);

            console.log("insert athletes");
            for (let athlete in encrypted_athletes) {
                Meteor.COLLECTIONS.Athletes.handle.insert(encrypted_athletes[athlete]);
            }

            console.log("insert accounts");
            for (let account in accounts) {
                Meteor.COLLECTIONS.Accounts.handle.insert(accounts[account]);
            }

            console.log("insert general");
            Meteor.COLLECTIONS.Contest.handle.insert({
                contestType: competitionTypeID,
                sportTypes: sportTypes
            });

            let listOFCompetitions = DBInterface.listCompetition();
            listOFCompetitions.push(competitionName);
            Meteor.COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {$set: {contests: listOFCompetitions}});
        }
    });

    // require('../../api/database/db_example')();
}