import {initGeneric} from "./generic";
import {initContest} from "./contest";
import {initAccounts} from "./accounts";
import {initAthletes} from "./athletes";
import {DBInterface} from "../db_access";

function initDatabase() {
    initAccounts();
    initAthletes();
    initContest();

    Meteor.COLLECTIONS.connect = function (competitionName) {
        if (Meteor.COLLECTIONS.Accounts.handles.hasOwnProperty(competitionName) || Meteor.COLLECTIONS.Athletes.handles.hasOwnProperty(competitionName) || Meteor.COLLECTIONS.Contest.handles.hasOwnProperty(competitionName)) {
            return false;
        }
        Meteor.COLLECTIONS.Accounts.connect(competitionName);
        Meteor.COLLECTIONS.Athletes.connect(competitionName);
        Meteor.COLLECTIONS.Contest.connect(competitionName);
        return true;
    };

    Meteor.COLLECTIONS.switch = function (competitionName) {
        if (!Meteor.COLLECTIONS.Accounts.handles.hasOwnProperty(competitionName) || !Meteor.COLLECTIONS.Athletes.handles.hasOwnProperty(competitionName) || !Meteor.COLLECTIONS.Contest.handles.hasOwnProperty(competitionName)) {
            return false;
        }
        if (Meteor.isServer) {
            Meteor.COLLECTIONS.Generic.handle.update({_id: DBInterface.getGenericID()}, {$set: {activeContest: competitionName}});
        }
        Meteor.COLLECTIONS.Accounts.switch(competitionName);
        Meteor.COLLECTIONS.Athletes.switch(competitionName);
        Meteor.COLLECTIONS.Contest.switch(competitionName);
        return true;
    };

    Meteor.COLLECTIONS.connect_and_switch = function (competitionName) {
        Meteor.COLLECTIONS.connect(competitionName);
        return Meteor.COLLECTIONS.switch(competitionName);
    };

    if (Meteor.isClient) {
        Meteor.COLLECTIONS.Generic.onReady(function () {
            const genericData = Meteor.COLLECTIONS.Generic.handle.findOne();
            Meteor.COLLECTIONS.connect_and_switch(genericData.activeContest);
        });
    } else {
        const genericData = Meteor.COLLECTIONS.Generic.handle.findOne();
        const allNames = genericData.contests.concat(genericData.editContests);
        for (let nameID in allNames) {
            Meteor.COLLECTIONS.connect(allNames[nameID]);
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