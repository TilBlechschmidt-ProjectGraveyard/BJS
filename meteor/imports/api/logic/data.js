export {Data};

//TODO daten löschen ohne dafür berechtigt zu sein ist möglich.
function Data() {
    /// data is an array of objects with id (view getSports) and measurement
    // example: [{encrypted_st_id: encrypted('st_sprint'), measurement: encrypted(16), signature_write: <signature>, signature_group: <signature>}]
    this.data = [];
}

Data.prototype = {
    get_plain: function (write_private_hash, group_private_hash) {
        return _.map(this.data, function (data_value) {
            return {
                st_id: data_value.encrypted_st_id, //TODO decrypt
                measurement: data_value.measurement, //TODO implement encryption and signature check
                error_code: 0
            };
        });
    },


    update: function (st_id, new_measurement, write_private_hash, group_private_hash) { //TODO implement encryption
        var encrypted_st_id = st_id; //TODO implement encryption
        var new_encrypted_measurement = new_measurement; //TODO implement encryption

        var old_data = _.where(this.data, {encrypted_st_id: encrypted_st_id})[0];
        if (old_data) {
            old_data.measurement = new_encrypted_measurement;
        } else {
            this.data.push({
                st_id: encrypted_st_id,
                measurement: new_encrypted_measurement,
                signature_write: "", //TODO implement signature
                signature_group: "" //TODO implement signature
            });
        }
    }
};
