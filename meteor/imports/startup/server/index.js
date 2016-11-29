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
    console.log('-----------------------------------------------------');
    console.log('---------------------- WARNING ----------------------');
    console.log('-----------------------------------------------------');
    console.log('                  Database not clean                 ');
    console.log('Clearing database and adding mock data entries . . .');

    // Delete everything in the regular db
    removeData(MongoInternals.defaultRemoteCollectionDriver());

    // Initialize the generic database first
    Generic.createMockData();

    // Set up the remaining databases using the data from the generic DB
    initializeDB();

    // Delete everything in the competition database
    removeData(Meteor.dbHandle);

    // Load 'em
    const COLLECTIONS = require('../../api/database/collections/collections');

    // Fill 'em with (fake) data
    for (let collection in COLLECTIONS)
        if (COLLECTIONS.hasOwnProperty(collection) && collection !== 'Generic') COLLECTIONS[collection].createMockData();

    console.log('-----------------------------------------------------');
    console.log('------------------------ DONE -----------------------');
    console.log('-----------------------------------------------------');
}

function removeData(driver) {
    let excludedCollections = ['system.indexes'];
    let db = driver.mongo.db;
    let getCollections = Meteor.wrapAsync(db.collections, db);
    let collections = getCollections();
    let appCollections = _.reject(collections, function (col) {
        return col.collectionName.indexOf('velocity') === 0 ||
            excludedCollections.indexOf(col.collectionName) !== -1;
    });

    _.each(appCollections, function (appCollection) {
        let remove = Meteor.wrapAsync(appCollection.remove, appCollection);
        remove({});
    });
}