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
    // example: [{encrypted_st_id: object, encrypted_measurements: object}]
    this.data = [];
}

Data.prototype = {
    /**
     * Returns the data in plain text.
     * @param {object} group_ac              auth. code of the group
     * @param {object} [station_ac]         auth. code of the station (if left out the station signature is not checked!)
     * @returns {boolean|{data: {st_id, measurements}[], log}}
     */
    getPlain: function (group_ac, station_ac) {
        var log = new Log();
        return {
            data: filterUndefined(_.map(this.data, function (data_object) {
                var st_id_decrypt_result = tryDecrypt(data_object.encrypted_st_id, [group_ac, station_ac]);
                var measurements_decrypt_result = tryDecrypt(data_object.encrypted_measurements, [group_ac, station_ac]);
                log.merge(st_id_decrypt_result.log);
                log.merge(measurements_decrypt_result.log);

                var st_id = st_id_decrypt_result.result;
                var measurements = measurements_decrypt_result.result;

                if (!(st_id && measurements)) {
                    log.addError("Unable to encrypt.");
                    return undefined;
                }
                return {
                    st_id: st_id,
                    measurements: measurements
                };
            })),
            log: log
        };
    },

    /**
     * Finds and returns the data_object with the given st_id.
     * @param st_id     the sport type of the data
     * @param group_ac  auth. code of the group
     * @returns {{group_signature, station_signature, data: {Array}}}
     */
    findEncrypted: function (st_id, group_ac) {
        return _.find(this.data, function (data_object) {
            var decrypted_data = tryDecrypt(data_object.encrypted_st_id, [group_ac]);
            return decrypted_data.result === st_id;
        });
    },

    /**
     * Updates the data of a given st_id.
     * @param {string} st_id                the sport type of the data
     * @param {number[]} new_measurements      the new data
     * @param {object} group_ac             auth. code of the group
     * @param {object} station_ac           auth. code of the station
     */
    update: function (st_id, new_measurements, group_ac, station_ac) {
        var encrypted_st_id = encrypt(st_id, group_ac, station_ac);
        var new_encrypted_measurements = encrypt(new_measurements, group_ac, station_ac);
        old_data = this.findEncrypted(st_id, group_ac);

        if (old_data) {
            old_data.encrypted_st_id = encrypted_st_id;
            old_data.encrypted_measurements = new_encrypted_measurements;
        } else {
            this.data.push({
                encrypted_st_id: encrypted_st_id,
                encrypted_measurements: new_encrypted_measurements,
            });
        }
    },

    // /**
    //  * Adds a measurement to the data of a given st_id.
    //  * @param {string} st_id                the sport type of the data
    //  * @param {number} new_measurement      the new data
    //  * @param {object} group_ac             auth. code of the group
    //  * @param {object} station_ac           auth. code of the station
    //  */
    // add: function (st_id, new_measurement, group_ac, station_ac) {
    //     var encrypted_st_id = encrypt(st_id, group_ac, station_ac);
    //     var new_encrypted_measurements = encrypt(new_measurements, group_ac, station_ac);
    //     old_data = this.findEncrypted(st_id, group_ac);
    //
    //     if (old_data) {
    //         old_data.encrypted_st_id = encrypted_st_id;
    //         old_data.encrypted_measurements.push(new_encrypted_measurements);
    //     } else {
    //         this.data.push({
    //             encrypted_st_id: encrypted_st_id,
    //             encrypted_measurements: new_encrypted_measurements,
    //         });
    //     }
    // }
};
