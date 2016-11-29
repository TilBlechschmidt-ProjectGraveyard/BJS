import {Generic} from '../../api/database/collections/generic.js';

const initializeDB = require("../../api/database/collections/initialize");

export function onStartup() {
    // Load the config.json into the (semi-global) Meteor.config object
    Meteor.config = require('../../../config.json');

    if (Meteor.config.competitionMongoURL === "EQUAL") Meteor.config.competitionMongoURL = process.env.MONGO_URL.replace(/([^\/]*)$/, "");

    if (!Meteor.isProduction) {
        // Check if the database is clean and whether or not its structure is outdated (and possibly recreate it if that's the case)
        let genericEntries = Generic.handle.find({}).fetch();
        //noinspection JSUnresolvedVariable
        if (!(
                genericEntries.length > 0 &&
                (genericEntries[0].hasOwnProperty('cleanDB') && genericEntries[0].cleanDB === true) &&
                (genericEntries[0].hasOwnProperty('dbVersion') && genericEntries[0].dbVersion === Meteor.config.dbVersion)
            )) clearDatabase();

        initializeDB();
    }
}

function clearDatabase() {
    import {resetDatabase} from 'meteor/xolvio:cleaner';
    console.log('-----------------------------------------------------');
    console.log('---------------------- WARNING ----------------------');
    console.log('-----------------------------------------------------');
    console.log('                  Database not clean                 ');
    console.log('Clearing database and adding mock data entries . . .');

    // Delete everything
    resetDatabase();

    // Initialize the generic database first
    Generic.createMockData();

    // Set up the remaining databases using the data from the generic DB
    initializeDB();

    // Load 'em
    const COLLECTIONS = require('../../api/database/collections/collections');

    // Fill 'em with (fake) data
    for (let collection in COLLECTIONS)
        if (COLLECTIONS.hasOwnProperty(collection) && collection !== 'Generic') COLLECTIONS[collection].createMockData();

    console.log('-----------------------------------------------------');
    console.log('------------------------ DONE -----------------------');
    console.log('-----------------------------------------------------');
}