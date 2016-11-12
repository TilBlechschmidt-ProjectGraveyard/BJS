import {Log} from "./../log";
import {encrypt, decrypt} from "./../crypto/crypto.js";
import {filterUndefined} from "./general";

export {Data};

//TODO daten löschen ohne dafür berechtigt zu sein ist möglich.
/**
 * Creates an empty Data object. The information in the Data object are encrypted. To read/write you always need the group_private_hash.
 * @constructor
 */
function Data() {
    /// data is an array of objects with id (view getSports) and measurement
    // example: [{encrypted_st_id: object, encrypted_measurement: object}]
    this.data = [];
}

Data.prototype = {
    /**
     * Returns the data in plain text.
     * @param {object} group_ac              auth. code of the group
     * @param {object} [station_ac]         auth. code of the station (if left out the station signature is not checked!)
     * @returns {boolean|{data, log}}
     */
    getPlain: function (group_ac, station_ac) {
        var log = new Log();
        return {
            data: filterUndefined(_.map(this.data, function (data_object) {
                var st_id = decrypt(data_object.encrypted_st_id, group_ac, station_ac);
                var measurement = decrypt(data_object.encrypted_measurement, group_ac, station_ac);

                if (!(st_id && measurement)) {
                    log.addError("Unable to encrypt.");
                    return undefined;
                }
                return {
                    st_id: st_id,
                    measurement: measurement
                };
            })),
            log: log
        };
    },

    /**
     * Updates the data of a given st_id.
     * @param {string} st_id                the sport type of the data
     * @param {number} new_measurement      the new data
     * @param {object} group_ac             auth. code of the group
     * @param {object} station_ac           auth. code of the station
     */
    update: function (st_id, new_measurement, group_ac, station_ac) {
        var encrypted_st_id = encrypt(st_id, group_ac, station_ac);
        var new_encrypted_measurement = encrypt(new_measurement, group_ac, station_ac);

        var old_data = _.find(this.data, function (data_object) {
            var decrypted_data = decrypt(data_object.encrypted_st_id, group_ac);
            return decrypted_data === st_id;
        });
        if (old_data) {
            old_data.encrypted_st_id = encrypted_st_id;
            old_data.encrypted_measurement = new_encrypted_measurement;
        } else {
            this.data.push({
                encrypted_st_id: encrypted_st_id,
                encrypted_measurement: new_encrypted_measurement,
            });
        }
    }
};
