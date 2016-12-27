import {encrypt, tryDecrypt} from "./../crypto/crypto.js";
import {filterUndefined} from "./general";
import {getAcsFromAccounts} from "./account";

/**
 * @summary Creates an empty object containing arbitrary data in an encrypted fashion. To read/write you always need the group_private_hash.
 * @constructor
 */
export function Data() {
    /// data is an array of objects with id (view getSports) and measurement
    // example: [{encryptedStID: object, encryptedMeasurements: object}]
    this.data = [];
}

Data.prototype = {
    /**
     * @typedef {Object} PlainData
     * @property {string} stID The id of the sport type
     * @property {object[]} measurements The decrypted
     */

    /**
     * @summary Returns the data in plain text.
     * @param log {Log} Logger instance to use
     * @param accounts {Account[]} Accounts that should be used for decryption
     * @param requireSignature {boolean} whether or not to enable signature enforcing
     * @param groupID {string} Identifier of the group this data is from
     * @returns {PlainData[]}
     */
    getPlain: function (log, accounts, requireSignature, groupID) {
        return filterUndefined(_.map(this.data, function (dataObject) {
            const acs = getAcsFromAccounts(accounts);
            const stIDDecryptResult = tryDecrypt(log, dataObject.encryptedStID, acs);
            const measurementsDecryptResult = tryDecrypt(log, dataObject.encryptedMeasurements, acs);

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
     * @summary Finds and returns the dataObject with the given sport (stID).
     * @param log {Log} Logger instance to use
     * @param stID {integer}    Identifier of the sport the returned data should be part of
     * @param acs {object[]}    List of authentication codes that should be used for decryption
     * @returns {{groupSignature, stationSignature, data: {Array}}}
     */
    findEncrypted: function (log, stID, acs) {
        return _.find(this.data, function (dataObject) {
            const decryptedData = tryDecrypt(log, dataObject.encryptedStID, acs);
            return decryptedData === stID;
        });
    },

    /**
     * @summary Updates the data of a given stID.
     * @param log {Log} Logger instance to use
     * @param stID {string} Identifier of the sport the returned data should be part of
     * @param newMeasurements {number[]} The measurements that should be inserted
     * @param groupAC   {Object} Authentication code of the group
     * @param stationAC {Object} Authentication code of the specified sport type
     */
    update: function (log, stID, newMeasurements, groupAC, stationAC) {
        const encryptedStID = encrypt(stID, groupAC, stationAC);
        const newEncryptedMeasurements = encrypt(newMeasurements, groupAC, stationAC);
        const oldData = this.findEncrypted(log, stID, [groupAC, stationAC]);

        if (oldData) {
            oldData.encryptedStID = encryptedStID;
            oldData.encryptedMeasurements = newEncryptedMeasurements;
        } else {
            this.data.push({
                encryptedStID: encryptedStID,
                encryptedMeasurements: newEncryptedMeasurements,
            });
        }
    }
};
