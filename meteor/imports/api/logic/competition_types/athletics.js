import {Log} from "../../log";
import {filterUndefined} from "./../general";


let LANG = require('./../../../data/athletics/lang_de.json');
let START_CLASSES = require('./../../../data/start_classes.json');

export let Athletics = {
    /**
     * Returns a list of sport types associated with the ct athletics.
     * @returns {{id: string, name: string, category: number, description: string, w: {age: number[], a: number, c: number, d: number, conversionFactor: {A1: number, A2: number, A3: number, A4: number, A5: number, A6: number, B1: number, B2: number, C1: number, C2: number, D: number, E: number}}, m: {age: number[], a: number, c: number, d: number, conversionFactor: {A1: number, A2: number, A3: number, A4: number, A5: number, A6: number, B1: number, B2: number, C1: number, C2: number, D: number, E: number}}}[]}
     */
    getSports: function () {
        return require('./../../../data/athletics/sports.json');
    },

    /**
     * Returns whether a given athlete can do the sport type with the id stID.
     * @param athlete
     * @param {string} stID
     * @returns {{canDoSport, dataObject, log}}
     */
    canDoSportType: function (athlete, stID) {

        var log = new Log();

        //collect information
        var baseInformation = _.find(this.getSports(), function (st) {
            return st.id === stID;
        });

        if (!baseInformation) {
            log.error(stID + " is not a valid sport type id.");
            return [false, undefined, log];
        }

        let genderInfo = athlete.isMale ? baseInformation.m : baseInformation.w;
        let handicapData = genderInfo.scoreCalculation.conversionFactor[athlete.handicap];

        let dataObject = {
            stID: stID,
            name: baseInformation.name,
            category: baseInformation.category,
            genderInfo: genderInfo,
            conversionFactor: handicapData === undefined ? 1.0 : handicapData
        };

        var canDoSport = true;

        if (_.indexOf(dataObject.genderInfo.age, athlete.age) == -1) {
            log.warning(athlete.getFullName() + " does not have a valid age for " + baseInformation.name + ".");
            canDoSport = false;
        }

        if (dataObject.conversionFactor === 0.0) {
            log.warning(athlete.getFullName() + " can not do " + baseInformation.name + " because of the start class " + athlete.handicap + ".");
            canDoSport = false;
        }

        return {
            canDoSport: canDoSport,
            dataObject: dataObject,
            log: log
        };
    },


    /**
     * Validates the data of an athlete and adds more information to it. A copy of the data is returned. Without the write_private_hash the data is just decrypted without a write-permission check.
     * @param athlete
     * @param {object[]} acs              auth. codes
     * * @returns {{validData, log}}
     */
    getValidData: function (athlete, acs) {
        // let sports = this.getSports();

        var plain = athlete.data.getPlain(acs);
        var log = plain.log;

        // filter data with more then on point
        var tmpData = _.filter(plain.data, function (dataObject) {
            return _.max(dataObject.measurements) > 0;
        });

        var that = this; //TODO alternative?

        // Add information
        tmpData = _.map(tmpData, function (dataObject) {
            let canDoSportObject = that.canDoSportType(athlete, dataObject.stID);
            log.merge(canDoSportObject.log);
            if (canDoSportObject.dataObject !== undefined) {
                canDoSportObject.dataObject.measurements = dataObject.measurements;
            }
            return canDoSportObject.canDoSport ? canDoSportObject.dataObject : undefined;
        });

        // filter undefined
        tmpData = filterUndefined(tmpData);

        return {
            validData: tmpData,
            log: log
        };
    },

    /**
     * Returns whether an athlete is already finished.
     * @param athlete
     * @param {object[]} acs              auth. codes
     * @returns {{valid, log}}
     */
    validate: function (athlete, acs) {
        var data = this.getValidData(athlete, acs);
        var categories = [false, false, false, false];
        for (var st in data.validData) {
            categories[data.validData[st].category] = true;
        }

        return {
            valid: 3 <= _.filter(categories, function (category) {
                return category;
            }).length,
            log: data.log
        };
    },

    /**
     * Calculates the score of one dataObject returned by the getValidData function.
     * @param dataObject
     * @returns {number[]}
     */
    calculateOne: function (dataObject) {
        var calculateFunction;

        switch (dataObject.stID) {
            case "st_sprint_50_el":
            case "st_sprint_75_el":
            case "st_sprint_100_el":
            case "st_endurance_800":
            case "st_endurance_1000":
            case "st_endurance_2000":
            case "st_endurance_3000":
                calculateFunction = function (d, m, a, c) {
                    return ((d / m) - a) / c;
                };
                break;
            case "st_sprint_50":
            case "st_sprint_75":
            case "st_sprint_100":
                calculateFunction = function (d, m, a, c) {
                    return ((d / (m + 0.24)) - a) / c;
                };
                break;
            default:
                calculateFunction = function (d, m, a, c) {
                    return ( Math.sqrt(m) - a) / c;
                };
        }

        return _.map(dataObject.measurements, function (measurement) {
            return Math.floor(calculateFunction(dataObject.genderInfo.scoreCalculation.d, dataObject.conversionFactor * measurement, dataObject.genderInfo.scoreCalculation.a, dataObject.genderInfo.scoreCalculation.c));
        });
    },

    /**
     * Calculates the score archived by a athlete. In case of incomplete data, the function will calculate as much as possible.
     * @param athlete
     * @param {object[]} acs              auth. codes
     * @returns {{score, log}}
     */
    calculate: function (athlete, acs) {
        var data = this.getValidData(athlete, acs);
        var log = data.log;

        var scores = [0, 0, 0, 0];

        for (var vd in data.validData) {
            let score = this.calculateOne(data.validData[vd]);
            let bestScore = _.max(score);
            let category = data.validData[vd].category;

            log.info(data.validData[vd].name + ': ' + score + " -> " + bestScore);

            if (scores[category] < bestScore) {
                scores[category] = bestScore;
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