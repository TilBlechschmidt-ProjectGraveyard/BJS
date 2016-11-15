import {COLLECTIONS} from '../../api/database/collections/collection';
import {resetDatabase} from 'meteor/xolvio:cleaner';

function clearDatabase() {
    console.log('-----------------------------------------------------');
    console.log('---------------------- WARNING ----------------------');
    console.log('-----------------------------------------------------');
    console.log('                  Database not clean                 ');
    console.log('Clearing database and adding mock data entries . . .');

    // Delete everything
    resetDatabase();

    // Fill it with (fake) data again
    for (let collection in COLLECTIONS)
        if (COLLECTIONS.hasOwnProperty(collection)) COLLECTIONS[collection].createMockData();

    console.log('-----------------------------------------------------');
    console.log('------------------------ DONE -----------------------');
    console.log('-----------------------------------------------------');
}

export function onStartup() {
    // Load the config.json into the (semi-global) Meteor.config object
    Meteor.config = require('../../../config.json');

    // Check if the database is clean and whether or not its structure is outdated (and possibly recreate it if that's the case)
    let genericEntries = COLLECTIONS.Generic.handle.find({}).fetch();
    //noinspection JSUnresolvedVariable
    if (!(
            genericEntries.length > 0 &&
            (genericEntries[0].hasOwnProperty('cleanDB') && genericEntries[0].cleanDB === true) &&
            (genericEntries[0].hasOwnProperty('dbVersion') && genericEntries[0].dbVersion === Meteor.config.dbVersion)
        )) clearDatabase();
}