import {Accounts} from './accounts';
import {Athletes} from './athletes';
import {Generic} from './generic';

export const COLLECTIONS = {
    Accounts: Accounts,
    Athletes: Athletes,
    Generic: Generic
};

export function Collection(name) {
    const col = this;

    col.name = name;

    col.handle = new Mongo.Collection(col.name);

    col.createMockData = function () {
        console.log("Test");
    };

    if (Meteor.isClient) Ground.Collection(col.handle);

    if (Meteor.isServer) {
        Meteor.publish(col.name, function () {
            return col.handle.find({});
        });
    }
}