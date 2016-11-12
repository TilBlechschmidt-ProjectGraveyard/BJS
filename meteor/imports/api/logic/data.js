import {Log} from "./../log";
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
     * @param {object[]} acs              auth. codes
     * @returns {boolean|{data: {stID, measurements}[], log}}
     */
    getPlain: function (acs) {
        var log = new Log();
        return {
            data: filterUndefined(_.map(this.data, function (dataObject) {
                var stIDDecryptResult = tryDecrypt(dataObject.encryptedStID, acs);
                var measurementsDecryptResult = tryDecrypt(dataObject.encryptedMeasurements, acs);
                log.merge(stIDDecryptResult.log);
                log.merge(measurementsDecryptResult.log);

                var stID = stIDDecryptResult.result;
                var measurements = measurementsDecryptResult.result;


                return {
                    stID: stID,
                    measurements: measurements
                };
            })),
            log: log
        };
    },

    /**
     * Finds and returns the dataObject with the given stID.
     * @param stID     the sport type of the data
     * @param {object[]} acs              auth. codes
     * @returns {{groupSignature, stationSignature, data: {Array}}}
     */
    findEncrypted: function (stID, acs) {
        return _.find(this.data, function (dataObject) {
            var decryptedData = tryDecrypt(dataObject.encryptedStID, acs);
            return decryptedData.result === stID;
        });
    },

    /**
     * Updates the data of a given stID.
     * @param {string} stID                the sport type of the data
     * @param {number[]} newMeasurements      the new data
     * @param groupAC      Group auth. code
     * @param stationAC    Station auth. code
     */
    update: function (stID, newMeasurements, groupAC, stationAC) {
        var encryptedStID = encrypt(stID, groupAC, stationAC);
        var newEncryptedMeasurements = encrypt(newMeasurements, groupAC, stationAC);
        var oldData = this.findEncrypted(stID, groupAC);

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
