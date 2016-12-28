import {Generic} from "./generic";

/**
 * @typedef {Object} Collections
 * @property {Mongo.Collection} Generic - Collection with general information about the server.
 * @property {Mongo.Collection} Contest - Collection with general information about the current contest.
 * @property {Mongo.Collection} Accounts - Collection with the accounts.
 * @property {Mongo.Collection} Athletes - Collection with the athletes.
 */


/**
 * Returns a list of all relevant collections.
 * @returns {Collections}
 */
function getCollections() {
    import {Contest} from './contest';
    import {Accounts} from './accounts';
    import {Athletes} from './athletes';

    return {
        Generic: Generic,
        Contest: Contest,
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

function clearDatabase(dbHandle) {
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

    if (!dbHandle) {
        dbHandle = Meteor.dbHandle;
    }

    // Delete everything in the competition database
    removeData(dbHandle);

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

/**
 * Returns a list of all relevant collections.
 * @returns {Collections}
 */
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
    }
    // else if (Meteor.isClient && !Meteor.dbInitialized) {
    //     console.error("WARNING - Attempting to access collections before the database got initialized!");
    //     console.error("This may or may not result in lost data, database corruption and or sudden death.");
    //     console.error("You should not proceed without fixing this first since it breaks almost all db communication!");
    // }

    return getCollections();
};