import {initGeneric} from "./generic";
import {initContests} from "./contests";
import {initAccounts} from "./accounts";
import {initAthletes} from "./athletes";
import {DBInterface} from "../DBInterface";

function initDatabase() {
    initAccounts();
    initAthletes();

    Meteor.COLLECTIONS.connect = function (competitionID) {
        if (Meteor.COLLECTIONS.Accounts.handles.hasOwnProperty(competitionID) || Meteor.COLLECTIONS.Athletes.handles.hasOwnProperty(competitionID)) {
            return false;
        }
        Meteor.COLLECTIONS.Accounts.connect(competitionID);
        Meteor.COLLECTIONS.Athletes.connect(competitionID);
        return true;
    };

    Meteor.COLLECTIONS.switch = function (competitionID) {
        if (!Meteor.COLLECTIONS.Accounts.handles.hasOwnProperty(competitionID) || !Meteor.COLLECTIONS.Athletes.handles.hasOwnProperty(competitionID)) {
            return false;
        }
        if (Meteor.isServer) {
            Meteor.COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {$set: {activeContest: competitionID}});
        }
        Meteor.COLLECTIONS.Accounts.switch(competitionID);
        Meteor.COLLECTIONS.Athletes.switch(competitionID);
        return true;
    };

    Meteor.COLLECTIONS.connect_and_switch = function (competitionID) {
        Meteor.COLLECTIONS.connect(competitionID);
        return Meteor.COLLECTIONS.switch(competitionID);
    };

    if (Meteor.isClient) {
        Meteor.COLLECTIONS.Generic.onReady(function () {
            const genericData = Meteor.COLLECTIONS.Generic.handle.findOne();
            Meteor.COLLECTIONS.connect_and_switch(genericData.activeContest);
        });
    } else {
        const genericData = Meteor.COLLECTIONS.Generic.handle.findOne();
        const competitions = Meteor.COLLECTIONS.Contests.handle.find({}).fetch();
        for (let competition in competitions) {
            if (!competitions.hasOwnProperty(competition)) continue;
            Meteor.COLLECTIONS.connect(competitions[competition]._id);
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
            }
        }

        if (clearDB) {
            clearDatabase();
        } else {
            initDatabase();
        }
    }
}