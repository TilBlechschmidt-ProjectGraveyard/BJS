import {Crypto} from "./../crypto/crypto";

/**
 * Object containing information about a specific account.
 * @param {string} name - Name of the account
 * @param {string[]} group_permissions - List of group names.
 * @param {string[]} score_write_permissions - List of sport type ids.
 * @param {AuthenticationCode} ac
 * @param {boolean=} canViewResults - Specifies whether the account has permissions to view the results.
 * @param {boolean=} isAdmin - Specifies whether the account has admin permissions.
 * @constructor
 */
export function Account(name, group_permissions, score_write_permissions, ac, canViewResults = false, isAdmin = false) {
    this.name = name;
    this.score_write_permissions = score_write_permissions;
    this.group_permissions = group_permissions;
    this.ac = ac;
    this.canViewResults = canViewResults;
    this.isAdmin = isAdmin;
}

/**
 * Returns whether the account has permissions for at least one group.
 * @param {Account} account - The Account
 * @return {boolean}
 */
export function isGroupAccount(account) {
    return account.group_permissions.length > 0;
}

/**
 * Returns whether the account has permissions for at least one station.
 * @param {Account} account - The Account
 * @return {boolean}
 */
export function isStationAccount(account) {
    return account.score_write_permissions.length > 0;
}

/**
 * Returns whether the account has permissions to view the results.
 * @param {Account} account - The Account
 * @return {boolean}
 */
export function canViewResults(account) {
    return account.canViewResults;
}

/**
 * Returns whether the account has admin permissions.
 * @param {Account} account - The Account
 * @return {boolean}
 */
export function isAdminAccount(account) {
    return account.isAdmin;
}

/**
 * Returns a comma separated list of the group names.
 * @param {Account} account - The Account
 * @return {string}
 */
export function getGroupNames(account) {
    return account.group_permissions.join(", ");
}

/**
 * Returns a login token used for Meteor.call.
 * @param {Account} account - The Account
 * @return {string}
 */
export function getLoginToken(account) {
    return Crypto.generateLoginToken(account.ac.privHash, account.ac.salt);
}

/**
 * @typedef {Object} LoginObject
 * @property {string} pubHash - The public Hash of the Code
 * @property {string} loginToken - The loginToken generated
 */

/**
 * Returns a login object used for Meteor.call.
 * @param {Account} account - The Account
 * @return {LoginObject}
 */
export function getLoginObject(account) {
    return {
        pubHash: account.ac.pubHash,
        loginToken: getLoginToken(account)
    };
}

/**
 * Returns a login object used for Meteor.call.
 * @param {Account} account - The Account
 * @param {LoginObject} loginObject - The long object
 * @return {boolean}
 */
export function checkLogin(account, loginObject) {
    if (loginObject.pubHash !== account.ac.pubHash) return false;

    const loginToken = getLoginToken(account);

    return loginObject.loginToken === loginToken;
}

/**
 * Returns a array of the human-readable station names.
 * @param {Account} account - The Account
 * @param ct - The competition type. This parameter is required because the human-readable station names are saved in the competition type namespace.
 * @return {string[]}
 */
export function getStationNamesAsArray(account, ct) {
    return _.map(account.score_write_permissions, function (stID) {
        return ct.getNameOfSportType(stID);
    });
}

/**
 * Returns a comma separated list of the human-readable station names.
 * @param {Account} account - The Account
 * @param ct - The competition type. This parameter is required because the human-readable station names are saved in the competition type namespace.
 * @return {string}
 */
export function getStationNames(account, ct) {
    return getStationNamesAsArray(account, ct).join(", ");
}

/**
 * Return the ACs from all passed accounts.
 * @param {Account[]} accounts
 * @returns {AuthenticationCode[]}
 */
export function getAcsFromAccounts(accounts) {
    return _.map(accounts, function (account) {
        return account.ac;
    });
}