import {Collection} from "./collection";

export let Generic = new Collection('Generic');

Generic.createMockData = function () {
    this.handle.insert({
        dbVersion: Meteor.config.dbVersion,
        cleanDB: true,
        activeContest: "bjs2016",
        contests: ["bjs2016"]
    });
};