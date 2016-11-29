import {Collection} from './collection';

export let Generic = new Collection('Generic', false);

Generic.createMockData = function () {
    this.handle.insert({
        dbVersion: Meteor.config.dbVersion,
        cleanDB: true
    });
};