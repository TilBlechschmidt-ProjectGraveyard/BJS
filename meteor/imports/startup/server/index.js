import {initCollections} from "../../api/database/collections/index";

export function onStartup() {
    // Load the config.json into the (semi-global) Meteor.config object
    Meteor.config = require('../../../config.json');
    initCollections();

    if (Meteor.config.competitionMongoURL === "EQUAL") Meteor.config.competitionMongoURL = process.env.MONGO_URL.replace(/([^\/]*)$/, "");

    Meteor.methods({
        'activateCompetition': function (competitionName) {
            Meteor.COLLECTIONS.switch(competitionName);
        },
        'createCompetition': function (competitionName, competitionTypeID, sportTypes, encrypted_athletes, accounts) {

            if (Meteor.COLLECTIONS.connect_and_switch(competitionName)) {

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
            } else {
                console.log("Error while switching contest");
            }


        }
    });

    // require('../../api/database/db_example')();
}