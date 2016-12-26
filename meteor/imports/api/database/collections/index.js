/**
 * Created by themegatb on 12/25/16.
 */

import {Generic} from './generic';

function getCollections() {
    import {Accounts} from './accounts';
    import {Athletes} from './athletes';

    return {
        Generic: Generic,
        Accounts: Accounts,
        Athletes: Athletes
    };
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

    // Set-up the remaining databases using the data from the generic DB
    setPrefix();

    // Delete everything in the competition database
    removeData(Meteor.dbHandle);

    // Load 'em
    const COLLECTIONS = getCollections();

    // Fill 'em with (fake) data
    for (let collection in COLLECTIONS)
        if (COLLECTIONS.hasOwnProperty(collection) && collection !== 'Generic') COLLECTIONS[collection].createMockData();

    console.log('-----------------------------------------------------');
    console.log('------------------------ DONE -----------------------');
    console.log('-----------------------------------------------------');
}

function setPrefix() {
    const dbPrefix = Generic.handle.find({}).fetch()[0].activeContest;
    Meteor.dbHandle = new MongoInternals.RemoteCollectionDriver(Meteor.config.competitionMongoURL + dbPrefix);
}

module.exports = function () {
    if (Meteor.isServer && !Meteor.dbInitialized) {
        if (!Meteor.isProduction) {
            // Check if the database is clean and whether or not its structure is outdated (and possibly recreate it if that's the case)
            let genericEntries = Generic.handle.find({}).fetch();
            //noinspection JSUnresolvedVariable
            if (!(
                    genericEntries.length > 0 &&
                    (genericEntries[0].hasOwnProperty('cleanDB') && genericEntries[0].cleanDB === true) &&
                    (genericEntries[0].hasOwnProperty('dbVersion') && genericEntries[0].dbVersion === Meteor.config.dbVersion)
                )) clearDatabase();
        }
        setPrefix();
        Meteor.dbInitialized = true;
    } else if (Meteor.isClient && !Meteor.dbInitialized) {
        console.error("WARNING - Attempting to access collections before the database got initialized!");
        console.error("This may or may not result in lost data, database corruption and or sudden death.");
        console.error("You should not proceed without fixing this first since it breaks almost all db communication!");
    }

    return getCollections();
};