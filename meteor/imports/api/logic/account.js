/**
 * Object containing information about a specific account.
 * @param {string[]} score_write_permissions - List of sport type ids.
 * @param {string[]} group_permissions - List of group names.
 * @param {AuthenticationCode} ac
 * @constructor
 */
export function Account(group_permissions, score_write_permissions, ac) {
    this.score_write_permissions = score_write_permissions;
    this.group_permissions = group_permissions;
    this.ac = ac;
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