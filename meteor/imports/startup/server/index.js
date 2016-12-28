
export function onStartup() {
    // Load the config.json into the (semi-global) Meteor.config object
    Meteor.config = require('../../../config.json');

    if (Meteor.config.competitionMongoURL === "EQUAL") Meteor.config.competitionMongoURL = process.env.MONGO_URL.replace(/([^\/]*)$/, "");

    const COLLECTIONS = require('../../api/database/collections')();

    Meteor.methods({
        'restart': function () {
            process.exit();
        }
    });

    require('../../api/database/db_example')();
}