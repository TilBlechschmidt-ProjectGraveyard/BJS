import {Collection} from "./collection";

export function initGeneric() {
    Meteor.COLLECTIONS.Generic = new Collection('Generic');

    Meteor.COLLECTIONS.Generic.createMockData = function () {
        this.handle.insert({
            dbVersion: Meteor.config.dbVersion,
            cleanDB: true,
            activeContest: "Beispiel Konfiguration",
            contests: ["Beispiel Konfiguration"],
            editContests: []
        });
    };
}