import {Generic} from "./generic";

/**
 * @typedef {Object} Collections
 * @property {Collection} Generic - Collection with general information about the server.
 * @property {ContestCollection} Contest - Collection with general information about the current contest.
 * @property {ContestCollection} Accounts - Collection with the accounts.
 * @property {ContestCollection} Athletes - Collection with the athletes.
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

    // Load 'em
    const COLLECTIONS = getCollections();

    // Fill 'em with (fake) data
    for (let collection in COLLECTIONS)
        if (COLLECTIONS.hasOwnProperty(collection) && collection !== 'Generic') COLLECTIONS[collection].createMockData();

    console.log('-----------------------------------------------------');
    console.log('------------------------ DONE -----------------------');
    console.log('-----------------------------------------------------');
}

/**
 * Returns a list of all relevant collections.
 * @returns {Collections}
 */
module.exports = function () {
    // load databases
    if (!Meteor.db) {
        Meteor.db = {};

        if (Meteor.isServer) {
            if (!Meteor.isProduction) {
                // Check if the database is clean and whether or not its structure is outdated (and possibly recreate it if that's the case)
                let genericEntries = Generic.handle.findOne();
                // noinspection JSUnresolvedVariable
                if (!(
                        genericEntries &&
                        (genericEntries.hasOwnProperty('cleanDB') && genericEntries.cleanDB === true) &&
                        (genericEntries.hasOwnProperty('dbVersion') && genericEntries.dbVersion === Meteor.config.dbVersion)
                    )) clearDatabase();
            }
        }
    }
    return getCollections();
};