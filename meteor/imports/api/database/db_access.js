import {Athletes} from "./collections/collections";
import {Athlete} from "../logic/athlete";


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