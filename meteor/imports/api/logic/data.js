import {encrypt, tryDecrypt} from "./../crypto/crypto.js";
import {filterUndefined} from "./general";
import {getAcsFromAccounts} from "./account";

/**
 * Creates an empty Data object. The information in the Data object are encrypted. To read/write you always need the group_private_hash.
 * @constructor
 */
export function Data() {
    /// data is an array of objects with id (view getSports) and measurement
    // example: [{encryptedStID: object, encryptedMeasurements: object}]
    this.data = [];
}

Data.prototype = {
    /**
     * Returns the data in plain text.
     * @param log
     * @param {object[]} accounts
     * @param requireSignature
     * @param groupID
     * @returns {{stID, measurements}[]}
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
     * Finds and returns the dataObject with the given stID.
     * @param log
     * @param stID     the sport type of the data
     * @param {object[]} acs              auth. codes
     * @returns {{groupSignature, stationSignature, data: {Array}}}
     */
    findEncrypted: function (log, stID, acs) {
        return _.find(this.data, function (dataObject) {
            const decryptedData = tryDecrypt(log, dataObject.encryptedStID, acs);
            return decryptedData === stID;
        });
    },

    /**
     * Updates the data of a given stID.
     * @param log
     * @param {string} stID                the sport type of the data
     * @param {number[]} newMeasurements      the new data
     * @param groupAC
     * @param stationAC
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
