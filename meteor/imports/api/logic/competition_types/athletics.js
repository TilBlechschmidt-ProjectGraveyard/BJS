export {Athletics};

let lang = require('./../../../data/athletics/lang_de.json');

let Athletics = {
    /**
     * Returns a list of sport types associated with the ct athletics.
     * @returns {{id: string, name: string, category: number, description: string, age_w: number[], age_m: number[]}[]}
     */
    getSports: function () {
        return require('./../../../data/athletics/sports.json');
    },


    /**
     * Validates the data of an athlete and adds more information to it. A copy of the data is returned. Without the write_private_hash the data is just decrypted without a write-permission check.
     * @param athlete
     * @param group_private_hash
     * @param write_private_hash
     * @returns {Array}
     */
    getValidData: function (athlete, group_private_hash, write_private_hash) {
        let sports = this.getSports(); //TODO add handicap check

        var [tmp_data, log] = athlete.data.getPlain(group_private_hash, write_private_hash);

        // filter data with more then on point
        tmp_data = _.filter(tmp_data, function (data_value) {
            return data_value.measurement > 0;
        });


        // add information to the data.
        tmp_data = _.map(tmp_data, function (data_value) {

            var base_information = _.find(sports, function (st) {
                return st.id === data_value.st_id;
            });
            if (!base_information) {
                log.addError(data_value.st_id + " is not a valid sport type id.");
                return undefined;
            }
            return {
                st_id: data_value.st_id,
                name: base_information.name,
                category: base_information.category,
                gender_info: athlete.is_male ? base_information.m : base_information.w,
                measurement: data_value.measurement
            };
        });

        // filter undefined and wrong age
        tmp_data = _.filter(tmp_data, function (data_value) {

            if (data_value === undefined) {
                return false;
            }

            if (_.indexOf(data_value.gender_info.age, athlete.age) == -1) {
                log.addWarning(athlete.getFullName() + " does not have a valid age for " + data_value.name + ".");
                return false;
            }
            return true;
        });

        return [tmp_data, log];
    },

    /**
     * Returns whether an athlete is already finished.
     * @param athlete
     * @returns {boolean}
     */
    validate: function (athlete) {
        var [validData, log] = this.getValidData(athlete);
        console.log(validData); //TODO remove
        var categories = [false, false, false, false];
        for (var st in validData) {
            categories[validData[st].category] = true;
        }

        return [
            3 <= _.filter(categories, function (category) {
                return category;
            }).length,
            log
        ];
    },

    calculate: function (data) {

    },

    /**
     * Returns an array of all ages which can be part of the BJS with the given configuration.
     * @param config_data
     */
    check_configuration: function (config_data) {

    },

    /**
     * Returns information about the ct athletics.
     */
    getInformation: function () {
        return require('./../../../data/athletics/information.json');
    },
};