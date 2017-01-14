import {Collection} from "./collection";
import {Account} from "../../logic/account";
import {Crypto} from "../../crypto/crypto";

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
                    'adminPassword': false,
                    'adminAccount.ac.privHash': false,
                    'cleanDB': false,
                    'dbVersion': false
                }
            });
        });
    });

    Meteor.COLLECTIONS.Generic.createMockData = function () {
        const adminPassword = "supersecret"; //genRandomCode(); // TODO: Add a random password
        this.handle.insert({
            dbVersion: Meteor.config.dbVersion,
            cleanDB: true,
            activeContest: "s0meVeryRand0mAndWe1rdDatabase1D",
            adminAccount: new Account("Administrator", ['Q#z'], [], Crypto.generateAC(adminPassword), true, true),
            adminPassword: adminPassword
        });
    };
}