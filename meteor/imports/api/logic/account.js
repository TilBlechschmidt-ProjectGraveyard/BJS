/**
 * Created by noah on 11/29/16.
 */

/**
 *
 * @param {string[]} score_write_permissions
 * @param {string[]} group_permissions
 * @param {*} ac
 * @constructor
 */
export function Account(group_permissions, score_write_permissions, ac) {
    this.score_write_permissions = score_write_permissions;
    this.group_permissions = group_permissions;
    this.ac = ac;
}


/**
 *
 * @param {*} accounts
 * @returns {Array}
 */
export function getAcsFromAccounts(accounts) {
    return _.map(accounts, function (account) {
        return account.ac;
    });
}