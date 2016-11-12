import {encrypt, tryDecrypt} from "./../crypto/crypto.js";
import {filterUndefined} from "./general";

//TODO daten löschen ohne dafür berechtigt zu sein ist möglich.
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
     * @param {object[]} acs              auth. codes
     * @returns {boolean|{stID, measurements}[]}
     */
    getPlain: function (log, acs) {
        return filterUndefined(_.map(this.data, function (dataObject) {
            var stIDDecryptResult = tryDecrypt(log, dataObject.encryptedStID, acs);
            var measurementsDecryptResult = tryDecrypt(log, dataObject.encryptedMeasurements, acs);

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
            var decryptedData = tryDecrypt(log, dataObject.encryptedStID, acs);
            return decryptedData === stID;
        });
    },

    /**
     * Updates the data of a given stID.
     * @param log
     * @param {string} stID                the sport type of the data
     * @param {number[]} newMeasurements      the new data
     * @param groupAC      Group auth. code
     * @param stationAC    Station auth. code
     */
    update: function (log, stID, newMeasurements, groupAC, stationAC) {
        var encryptedStID = encrypt(stID, groupAC, stationAC);
        var newEncryptedMeasurements = encrypt(newMeasurements, groupAC, stationAC);
        var oldData = this.findEncrypted(log, stID, [groupAC, stationAC]);

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
