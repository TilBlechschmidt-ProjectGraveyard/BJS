import {Log} from "../../log";

export {Athletics};

let LANG = require('./../../../data/athletics/lang_de.json');
let START_CLASSES = require('./../../../data/start_classes.json');

let Athletics = {
    /**
     * Returns a list of sport types associated with the ct athletics.
     * @returns {{id: string, name: string, category: number, description: string, age_w: number[], age_m: number[]}[]}
     */
    getSports: function () {
        return require('./../../../data/athletics/sports.json');
    },

    /**
     * Returns whether a given athlete can do the sport type with the id st_id.
     * @param athlete
     * @param {string} st_id
     * @returns {*[]}
     */
    canDoSportType: function (athlete, st_id) {

        var log = new Log();

        //collect information
        var base_information = _.find(this.getSports(), function (st) {
            return st.id === st_id;
        });

        if (!base_information) {
            log.addError(st_id + " is not a valid sport type id.");
            return [false, undefined, log];
        }

        let gender_info = athlete.is_male ? base_information.m : base_information.w;
        let handicap_data = gender_info.score_calculation.conversion_factor[athlete.handicap];

        let data_object = {
            st_id: st_id,
            name: base_information.name,
            category: base_information.category,
            gender_info: gender_info,
            conversion_factor: handicap_data === undefined ? 1.0 : handicap_data
        };

        var can_do_sport = true;

        if (_.indexOf(data_object.gender_info.age, athlete.age) == -1) {
            log.addWarning(athlete.getFullName() + " does not have a valid age for " + base_information.name + ".");
            can_do_sport = false;
        }

        if (data_object.conversion_factor === 0.0) {
            log.addWarning(athlete.getFullName() + " can not do " + base_information.name + " because of the start class " + athlete.handicap + ".");
            can_do_sport = false;
        }

        return [can_do_sport, data_object, log];
    },


    /**
     * Validates the data of an athlete and adds more information to it. A copy of the data is returned. Without the write_private_hash the data is just decrypted without a write-permission check.
     * @param athlete
     * @param group_private_hash
     * @param write_private_hash
     * @returns {Array}
     */
    getValidData: function (athlete, group_private_hash, write_private_hash) {
        // let sports = this.getSports();

        var [tmp_data, log] = athlete.data.getPlain(group_private_hash, write_private_hash);

        // filter data with more then on point
        tmp_data = _.filter(tmp_data, function (data_object) {
            return data_object.measurement > 0;
        });

        var that = this; //TODO alternative?

        // Add information
        tmp_data = _.map(tmp_data, function (data_object) {
            let [can_do_sport, new_data_object, new_log] = that.canDoSportType(athlete, data_object.st_id);
            log.merge(new_log);
            return can_do_sport ? new_data_object : undefined;
        });

        // filter undefined
        tmp_data = _.filter(tmp_data, function (data_value) {
            return data_value !== undefined;
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