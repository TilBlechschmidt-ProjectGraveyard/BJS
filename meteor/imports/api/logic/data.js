import {Crypto} from "./../crypto/crypto.js";
import {filterUndefined} from "./general";
import {getAcsFromAccounts} from "./account";

/**
 * Creates an empty object containing arbitrary data in an encrypted fashion. To read/write you always need the group_private_hash.
 * @param {object} [data]
 * @constructor
 */
export function Data(data) {
    /// data is an array of objects with id (view getSports) and measurement
    // example: [{encryptedStID: object, encryptedMeasurements: object}]
    if (data) {
        this.data = data;
    } else {
        this.data = [];
    }

}

Data.prototype = {
    /**
     * @typedef {Object} PlainData
     * @property {string} stID - The id of the sport type
     * @property {object[]} measurements - The decrypted
     */

    /**
     * Returns the data in plain text.
     * @param {Log} log - Logger instance to use
     * @param {Account[]} accounts - Accounts that should be used for decryption
     * @param {boolean} requireSignature - whether or not to enable signature enforcing
     * @param {string} groupID - Identifier of the group this data is from
     * @returns {PlainData[]}
     */
    getPlain: function (log, accounts, requireSignature, groupID) {
        return filterUndefined(_.map(this.data, function (dataObject) {
            const acs = getAcsFromAccounts(accounts);
            const stIDDecryptResult = Crypto.tryDecrypt(log, dataObject.encryptedStID, acs);
            const measurementsDecryptResult = Crypto.tryDecrypt(log, dataObject.encryptedMeasurements, acs);

            if (requireSignature && !(stIDDecryptResult.signatureEnforced && measurementsDecryptResult.signatureEnforced)) {
                log.error('Die Signatur der Sport Art mit der ID ' + stIDDecryptResult.data + ' konnte nicht überprüft werden, obwohl sie benötigt wird.');
                return undefined;
            }

            if (accounts[stIDDecryptResult.usedACs.groupAC].group_permissions.indexOf(groupID) == -1 ||
                accounts[measurementsDecryptResult.usedACs.groupAC].group_permissions.indexOf(groupID) == -1) {
                log.error('Der Gruppen Account, der verwendet wurde um die Daten zu speichern, hat dafür keine Berechtigung.');
                return undefined;
            }

            if ((stIDDecryptResult.signatureEnforced && accounts[stIDDecryptResult.usedACs.stationAC].score_write_permissions.indexOf(stIDDecryptResult.data) == -1) ||
                (measurementsDecryptResult.signatureEnforced && accounts[measurementsDecryptResult.usedACs.stationAC].score_write_permissions.indexOf(stIDDecryptResult.data) == -1)) {
                log.error('Der Stations Account, der verwendet wurde um die Daten zu speichern, hat dafür keine Berechtigung.');
                return undefined;
            }

            return {
                stID: stIDDecryptResult,
                measurements: measurementsDecryptResult
            };
        }));
    },

    /**
     * Finds and returns the dataObject with the given sport (stID).
     * @param {Log} log - Logger instance to use
     * @param {number} stID - Identifier of the sport the returned data should be part of
     * @param {AuthenticationCode[]} acs - List of authentication codes that should be used for decryption
     * @returns {{groupSignature, stationSignature, data: {Array}}}
     */
    findEncrypted: function (log, stID, acs) {
        return _.find(this.data, function (dataObject) {
            const decryptedData = Crypto.tryDecrypt(log, dataObject.encryptedStID, acs);
            return decryptedData === stID;
        });
    },

    /**
     * Updates the data of a given stID.
     * @param {Log} log - Logger instance to use
     * @param {number} stID - Identifier of the sport the returned data should be part of
     * @param {number[]} newMeasurements The measurements that should be inserted
     * @param {AuthenticationCode} groupAC - Authentication code of the group
     * @param {AuthenticationCode} stationAC -  Authentication code of the specified sport type
     */
    push: function (log, stID, newMeasurements, groupAC, stationAC) {
        const encryptedStID = Crypto.encrypt(stID, groupAC, stationAC);
        const newEncryptedMeasurements = Crypto.encrypt(newMeasurements, groupAC, stationAC);
        // const oldData = this.findEncrypted(log, stID, [groupAC, stationAC]);
        //
        // if (oldData) {
        //     oldData.encryptedStID = encryptedStID;
        //     oldData.encryptedMeasurements = newEncryptedMeasurements;
        // } else {
        this.data.push({
            encryptedStID: encryptedStID,
            encryptedMeasurements: newEncryptedMeasurements,
        });
        // }
    }
};
