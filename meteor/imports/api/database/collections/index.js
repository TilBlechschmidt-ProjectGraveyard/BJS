import {initGeneric} from "./generic";
import {initContests} from "./contests";
import {initAccounts} from "./accounts";
import {initAthletes} from "./athletes";
import {Server} from "../ServerInterface";

function initDatabase() {
    initAccounts();
    initAthletes();

    Meteor.COLLECTIONS.connect = function (contestID) {
        if (Meteor.COLLECTIONS.Accounts.handles.hasOwnProperty(contestID) || Meteor.COLLECTIONS.Athletes.handles.hasOwnProperty(contestID)) {
            return false;
        }
        Meteor.COLLECTIONS.Accounts.connect(contestID);
        Meteor.COLLECTIONS.Athletes.connect(contestID);
        return true;
    };

    Meteor.COLLECTIONS.switch = function (contestID) {
        if (!Meteor.COLLECTIONS.Accounts.handles.hasOwnProperty(contestID) || !Meteor.COLLECTIONS.Athletes.handles.hasOwnProperty(contestID)) {
            return false;
        }
        if (Meteor.isServer) {
            Meteor.COLLECTIONS.Generic.handle.update({_id: Server.db.getGenericID()}, {$set: {activeContest: contestID}});
        }
        Meteor.COLLECTIONS.Accounts.switch(contestID);
        Meteor.COLLECTIONS.Athletes.switch(contestID);
        return true;
    };

    Meteor.COLLECTIONS.connect_and_switch = function (contestID) {
        Meteor.COLLECTIONS.connect(contestID);
        return Meteor.COLLECTIONS.switch(contestID);
    };

    if (Meteor.isClient) {
        Meteor.COLLECTIONS.Generic.onReady(function () {
            const genericData = Meteor.COLLECTIONS.Generic.handle.findOne();
            Meteor.COLLECTIONS.connect_and_switch(genericData.activeContest);
        });
    } else {
        const genericData = Meteor.COLLECTIONS.Generic.handle.findOne();
        const contests = Meteor.COLLECTIONS.Contests.handle.find({}).fetch();
        for (let contest in contests) {
            if (!contests.hasOwnProperty(contest)) continue;
            Meteor.COLLECTIONS.connect(contests[contest]._id);
        }
        Meteor.COLLECTIONS.switch(genericData.activeContest);
    }
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

    Meteor.COLLECTIONS.Generic.createMockData();

    Meteor.COLLECTIONS.Contests.createMockData();

    // init Data
    initDatabase();

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
        // let clearDB = true;
        initGeneric();
        initContests();

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
            } else if (Meteor.COLLECTIONS.Generic.handle.findOne() == undefined) {
                clearDB = true;
            }
        }

        if (clearDB) {
            clearDatabase();
        } else {
            initDatabase();
        }
    }
}