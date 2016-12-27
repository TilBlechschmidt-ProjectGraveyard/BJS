/**
 * @summary Object containing information about a specific account
 * @param {string[]} score_write_permissions
 * @param {string[]} group_permissions
 * @param {Object} ac
 * @constructor
 */
export function Account(group_permissions, score_write_permissions, ac) {
    this.score_write_permissions = score_write_permissions;
    this.group_permissions = group_permissions;
    this.ac = ac;
}


/**
 * @summary Return the ACs from all passed accounts
 * @param {Object[]} accounts
 * @returns {Object[]}
 */
export function getAcsFromAccounts(accounts) {
    return _.map(accounts, function (account) {
        return account.ac;
    });
}