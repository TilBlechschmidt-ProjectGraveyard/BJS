import {Collection} from "./collection";

export function initGeneric() {
    Meteor.COLLECTIONS.Generic = new Collection('Generic', function (name, handle) {
        // deny all writing access
        handle.deny({
            insert() {
                return true;
            },
            update() {
                return true;
            },
            remove() {
                return true;
            },
        });

        Meteor.publish(name, function () {
            return handle.find({}, {
                fields: {
                    'adminAccount.ac.privHash': false,
                    'cleanDB': false,
                    'dbVersion': false
                }
            });
        });
    });

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