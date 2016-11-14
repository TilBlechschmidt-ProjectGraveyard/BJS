import {filterUndefined} from "./../general";


let LANG = require('./../../../data/athletics/lang_de.json');
let CERTIFICATE_INFO = require('./../../../data/athletics/certificate_info.json');
let START_CLASSES = require('./../../../data/start_classes.json');

export let Athletics = {
    maxAge: 20,
    /**
     * Returns a list of sport types associated with the ct athletics.
     * @returns {{id: string, name: string, category: number, unit: string,  description: string, w: {age: number[], a: number, c: number, d: number, conversionFactor: {A1: number, A2: number, A3: number, A4: number, A5: number, A6: number, B1: number, B2: number, C1: number, C2: number, D: number, E: number}}, m: {age: number[], a: number, c: number, d: number, conversionFactor: {A1: number, A2: number, A3: number, A4: number, A5: number, A6: number, B1: number, B2: number, C1: number, C2: number, D: number, E: number}}}[]}
     */
    getSports: function () {
        return require('./../../../data/athletics/sports.json');
    },

    /**
     * Returns whether a given athlete can do the sport type with the id stID.
     * @param log
     * @param athlete
     * @param {string} stID
     * @returns {{canDoSport, dataObject, log}}
     */
    canDoSportType: function (log, athlete, stID) {
        //collect information
        var baseInformation = _.find(this.getSports(), function (st) {
            return st.id === stID;
        });

        if (!baseInformation) {
            log.error(stID + " ist keine gültige Sport ID.");
            return {
                canDoSport: false,
                dataObject: undefined
            };
        }

        let genderInfo = athlete.isMale ? baseInformation.m : baseInformation.w;
        let handicapData = genderInfo.scoreCalculation.conversionFactor[athlete.handicap];

        let dataObject = {
            stID: stID,
            name: baseInformation.name,
            category: baseInformation.category,
            unit: baseInformation.unit,
            genderInfo: genderInfo,
            conversionFactor: handicapData === undefined ? 1.0 : handicapData
        };

        var canDoSport = true;

        if (_.indexOf(dataObject.genderInfo.age, athlete.tableAge) == -1) {
            log.warning(athlete.getFullName() + " hat kein gültiges Alter für " + baseInformation.name + ".");
            canDoSport = false;
        }

        if (dataObject.conversionFactor === 0.0) {
            log.warning(athlete.getFullName() + " can die Sportart " + baseInformation.name + " aufgrund der Startklasse " + athlete.handicap + " nicht durchführen.");
            canDoSport = false;
        }

        return {
            canDoSport: canDoSport,
            dataObject: dataObject
        };
    },


    /**
     * Validates the data of an athlete and adds more information to it. A copy of the data is returned. Without the write_private_hash the data is just decrypted without a write-permission check.
     * @param log
     * @param athlete
     * @param {object[]} acs              auth. codes
     * * @param requireSignature
     * * @returns {object[]}
     */
    getValidData: function (log, athlete, acs, requireSignature) {
        // let sports = this.getSports();

        var plain = athlete.data.getPlain(log, acs);

        // filter data with more then on point
        var tmpData = _.filter(plain, function (dataObject) {
            return _.max(dataObject.measurements) > 0;
        });

        var that = this; //TODO alternative?

        // Add information
        tmpData = _.map(tmpData, function (dataObject) {
            let canDoSportObject = that.canDoSportType(log, athlete, dataObject.stID.data);

            if (requireSignature && !(dataObject.stID.signatureEnforced && dataObject.stID.signatureEnforced)) {
                log.error("Die Signatur der Sport Art " + canDoSportObject.dataObject.name + " konnte nicht überprüft werden, obwohl sie benüotigt wird..");
                return undefined;
            }

            if (canDoSportObject.dataObject !== undefined) {
                canDoSportObject.dataObject.measurements = dataObject.measurements.data;
            }
            return canDoSportObject.canDoSport ? canDoSportObject.dataObject : undefined;
        });

        // filter undefined
        tmpData = filterUndefined(tmpData);


        return tmpData;
    },

    /**
     * Returns whether an athlete is already finished.
     * @param log
     * @param athlete
     * @param {object[]} acs              auth. codes
     * @param requireSignature
     * @returns {boolean}
     */
    validate: function (log, athlete, acs, requireSignature) {
        var data = this.getValidData(log, athlete, acs, requireSignature);
        var categories = [];
        for (var st in data) {
            categories[data[st].category] = true;
        }

        return 3 <= _.filter(categories, function (category) {
                return category;
            }).length;
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
     * @param log
     * @param athlete
     * @param {object[]} acs              auth. codes
     * @param requireSignature
     * @returns {number}
     */
    calculate: function (log, athlete, acs, requireSignature) {
        var validData = this.getValidData(log, athlete, acs, requireSignature);

        var scores = [0, 0, 0, 0];

        for (var vd in validData) {
            let score = this.calculateOne(validData[vd]);
            let bestScore = _.max(score);
            let category = validData[vd].category;

            log.info(validData[vd].name + ': ' + validData[vd].measurements + validData[vd].unit + " (" + score + ") -> " + bestScore);

            if (scores[category] < bestScore) {
                scores[category] = bestScore;
            }
        }

        return _.reduce(_.sortBy(scores, function (num) {
                return num;
            }).splice(1, 3), function (mem, num) {
                return mem + num;
        }, 0);
    },

    /**
     * Returns information about the ct athletics.
     * @returns {object}
     */
    getInformation: function () {
        return require('./../../../data/athletics/information.json');
    },

    /**
     * Returns the min. score for the different certificates.
     * @param log
     * @param athlete
     * @returns {undefined|number[]}
     */
    getCertificateInfo: function (log, athlete) {
        if (athlete.check(log) === false) {
            log.error("Athletenprüfung fehlgechlagen. Bitte überprüfen sie die Einstellungen des Athleten (" + athlete.getFullName() + ").");
            return undefined;
        }

        var genderInfo = athlete.isMale ? CERTIFICATE_INFO.m : CERTIFICATE_INFO.w;

        return genderInfo[athlete.age];
    },

    generateCertificate: function (log, athlete, acs, requireSignature) {
        var score = this.calculate(log, athlete, acs, requireSignature);

        var certificate = -1;

        var certificateInfo = this.getCertificateInfo(log, athlete);

        if (certificateInfo !== undefined) {
            if (score >= certificateInfo[1]) {
                certificate = 2;
            } else if (score >= certificateInfo[0]) {
                certificate = 1;
            } else {
                certificate = 0;
            }
        }

        return {
            score: score,
            certificate: certificate
        };
    }
};