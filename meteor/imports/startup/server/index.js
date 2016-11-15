import {COLLECTIONS} from '../../api/database/collections/collection';
import {resetDatabase} from 'meteor/xolvio:cleaner';

function clearDatabase(dbVersion) {
    console.log('-----------------------------------------------------');
    console.log('---------------------- WARNING ----------------------');
    console.log('-----------------------------------------------------');
    console.log('                  Database not clean                 ');
    console.log('Clearing database and adding mock data entries . . .');
    resetDatabase();
    for (let collection in COLLECTIONS)
        if (COLLECTIONS.hasOwnProperty(collection)) COLLECTIONS[collection].createMockData();
    console.log('-----------------------------------------------------');
    console.log('------------------------ DONE -----------------------');
    console.log('-----------------------------------------------------');
}

export function onStartup() {
    const dbVersion = require('../../../config.json').dbVersion;
    let genericEntries = COLLECTIONS.Generic.handle.find({}).fetch();
    //noinspection JSUnresolvedVariable
    if (!(
            genericEntries.length > 0 &&
            (genericEntries[0].hasOwnProperty('cleanDB') && genericEntries[0].cleanDB === true) &&
            (genericEntries[0].hasOwnProperty('dbVersion') && genericEntries[0].dbVersion === dbVersion)
        )
    ) {
        clearDatabase(dbVersion);
    }
}