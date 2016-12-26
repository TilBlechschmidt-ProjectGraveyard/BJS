const Athletes = require("./collections")().Athletes;
// import {Athletes} from "./collections";
import {Athlete} from "../logic/athlete";
import {promiseSubscribe} from "meteor/maximum:promise-subscribe";

export function waitForReady(callback) {
    Promise.all([
        promiseSubscribe.call(Meteor, 'Generic'),
        promiseSubscribe.call(Meteor, 'Accounts'),
        promiseSubscribe.call(Meteor, 'Athletes')
    ]).then(values => {
        console.log("finished!");
        callback();
    });
}

export function getAthletesOfAccounts(log, account, require_signature) {
    let result = [];

    Athletes.handle.find().fetch().forEach(function (obj) {
        const decrypted = Athlete.decryptFromDatabase(log, obj, account, require_signature);
        if (decrypted) {
            result.push(decrypted);
        }
    });
    return result;
}