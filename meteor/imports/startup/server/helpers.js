import {checkLogin} from "../../api/logic/account";
import {Crypto} from "../../api/crypto/crypto";

/**
 * Returns the admin account.
 * @returns {Account}
 */
export function getAdminAccount() {
    return Meteor.COLLECTIONS.Generic.handle.findOne().adminAccount;
}

/**
 *
 * @param {LoginObject} loginObject
 * @returns {boolean}
 */
export function checkAdminLogin(loginObject) { //TODO check isAdmin member
    return checkLogin(getAdminAccount(), loginObject);
}

export const encryptAsAdmin = function (data) {
    return Crypto.encrypt(data, getAdminAccount().ac, getAdminAccount().ac);
};
module.exports.encryptAsAdmin = encryptAsAdmin;


export function encryptAs(data, account) {
    return Crypto.encrypt(data, account.ac, account.ac);
}