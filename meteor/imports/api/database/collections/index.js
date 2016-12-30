import {initGeneric} from "./generic";
import {initContest} from "./contest";
import {initAccounts} from "./accounts";
import {initAthletes} from "./athletes";

function initDatabase() {
    initAccounts();
    initAthletes();
    initContest();
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

    Meteor.COLLECTIONS.Generic.createMockData();

    // init Data
    initDatabase();

    Meteor.COLLECTIONS.Contest.createMockData();
    Meteor.COLLECTIONS.Accounts.createMockData();
    Meteor.COLLECTIONS.Athletes.createMockData();

    console.log('-----------------------------------------------------');
    console.log('------------------------ DONE -----------------------');
    console.log('-----------------------------------------------------');
}

/**
 * Creates all collections.
 */
export function initCollections() {
    // load databases
    if (!Meteor.COLLECTIONS) {
        Meteor.COLLECTIONS = {};

        let clearDB = false;
        console.log("init database");
        initGeneric();

        if (Meteor.isServer) {
            if (!Meteor.isProduction) {
                // Check if the database is clean and whether or not its structure is outdated (and possibly recreate it if that's the case)
                let genericEntries = Meteor.COLLECTIONS.Generic.handle.findOne();
                // noinspection JSUnresolvedVariable
                if (!(
                        genericEntries &&
                        (genericEntries.hasOwnProperty('cleanDB') && genericEntries.cleanDB === true) &&
                        (genericEntries.hasOwnProperty('dbVersion') && genericEntries.dbVersion === Meteor.config.dbVersion)
                    )) clearDB = true;
            }
        }

        if (clearDB) {
            clearDatabase();
        } else {
            initDatabase();
        }
    }
}