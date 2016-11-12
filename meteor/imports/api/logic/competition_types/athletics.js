import {Log} from "../../log";
import {filterUndefined} from "./../general";

export {Athletics};

let LANG = require('./../../../data/athletics/lang_de.json');
let START_CLASSES = require('./../../../data/start_classes.json');

let Athletics = {
    /**
     * Returns a list of sport types associated with the ct athletics.
     * @returns {{id: string, name: string, category: number, description: string, w: {age: number[], a: number, c: number, d: number, conversion_factor: {A1: number, A2: number, A3: number, A4: number, A5: number, A6: number, B1: number, B2: number, C1: number, C2: number, D: number, E: number}}, m: {age: number[], a: number, c: number, d: number, conversion_factor: {A1: number, A2: number, A3: number, A4: number, A5: number, A6: number, B1: number, B2: number, C1: number, C2: number, D: number, E: number}}}[]}
     */
    getSports: function () {
        return require('./../../../data/athletics/sports.json');
    },

    /**
     * Returns whether a given athlete can do the sport type with the id st_id.
     * @param athlete
     * @param {string} st_id
     * @returns {{can_do_sport, data_object, log}}
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

        return {
            can_do_sport: can_do_sport,
            data_object: data_object,
            log: log
        };
    },


    /**
     * Validates the data of an athlete and adds more information to it. A copy of the data is returned. Without the write_private_hash the data is just decrypted without a write-permission check.
     * @param athlete
     * @param {object} group_ac              auth. code of the group
     * @param {object} [station_ac]         auth. code of the station (if left out the station signature is not checked!)
     * @returns {{valid_data, log}}
     */
    getValidData: function (athlete, group_ac, station_ac) {
        // let sports = this.getSports();

        var plain = athlete.data.getPlain(group_ac, station_ac);
        var log = plain.log;

        // filter data with more then on point
        var tmp_data = _.filter(plain.data, function (data_object) {
            return _.max(data_object.measurements) > 0;
        });

        var that = this; //TODO alternative?

        // Add information
        tmp_data = _.map(tmp_data, function (data_object) {
            let can_do_sport_object = that.canDoSportType(athlete, data_object.st_id);
            log.merge(can_do_sport_object.log);
            if (can_do_sport_object.data_object !== undefined) {
                can_do_sport_object.data_object.measurements = data_object.measurements;
            }
            return can_do_sport_object.can_do_sport ? can_do_sport_object.data_object : undefined;
        });

        // filter undefined
        tmp_data = filterUndefined(tmp_data);

        return {
            valid_data: tmp_data,
            log: log
        };
    },

    /**
     * Returns whether an athlete is already finished.
     * @param athlete
     * @param {object} group_ac              auth. code of the group
     * @param {object} [station_ac]         auth. code of the station (if left out the station signature is not checked!)
     * @returns {{valid, log}}
     */
    validate: function (athlete, group_ac, station_ac) {
        var data = this.getValidData(athlete, group_ac, station_ac);
        var categories = [false, false, false, false];
        for (var st in data.valid_data) {
            categories[data.valid_data[st].category] = true;
        }

        return {
            valid: 3 <= _.filter(categories, function (category) {
                return category;
            }).length,
            log: data.log
        };
    },

    /**
     * Calculates the score of one data_object returned by the getValidData function.
     * @param data_object
     * @returns {number[]}
     */
    calculateOne: function (data_object) {
        var calculate_function;

        switch (data_object.st_id) {
            case "st_sprint_50_el":
            case "st_sprint_75_el":
            case "st_sprint_100_el":
            case "st_endurance_800":
            case "st_endurance_1000":
            case "st_endurance_2000":
            case "st_endurance_3000":
                calculate_function = function (d, m, a, c) {
                    return ((d / m) - a) / c;
                };
                break;
            case "st_sprint_50":
            case "st_sprint_75":
            case "st_sprint_100":
                calculate_function = function (d, m, a, c) {
                    return ((d / (m + 0.24)) - a) / c;
                };
                break;
            default:
                calculate_function = function (d, m, a, c) {
                    return ( Math.sqrt(m) - a) / c;
                };
        }

        return _.map(data_object.measurements, function (measurement) {
            return Math.floor(calculate_function(data_object.gender_info.score_calculation.d, data_object.conversion_factor * measurement, data_object.gender_info.score_calculation.a, data_object.gender_info.score_calculation.c));
        });
    },

    /**
     * Calculates the score archived by a athlete. In case of incomplete data, the function will calculate as much as possible.
     * @param athlete
     * @param {object} group_ac              auth. code of the group
     * @param {object} [station_ac]         auth. code of the station (if left out the station signature is not checked!)
     * @returns {{score, log}}
     */
    calculate: function (athlete, group_ac, station_ac) {
        var data = this.getValidData(athlete, group_ac, station_ac);
        var log = data.log;

        var scores = [0, 0, 0, 0];

        for (var vd in data.valid_data) {
            let score = this.calculateOne(data.valid_data[vd]);
            let best_score = _.max(score);
            let category = data.valid_data[vd].category;

            log.addInfo(data.valid_data[vd].name + ': ' + score + " -> " + best_score);

            if (scores[category] < best_score) {
                scores[category] = best_score;
            }
        }

        return {
            score: _.reduce(_.sortBy(scores, function (num) {
                return num;
            }).splice(1, 3), function (mem, num) {
                return mem + num;
            }, 0),
            log: log
        };
    },

    /**
     * Returns information about the ct athletics.
     * @returns {object}
     */
    getInformation: function () {
        return require('./../../../data/athletics/information.json');
    },
};