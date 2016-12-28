import {filterUndefined} from "./../general";

/**
 * Object containing all information and functions required for Swimming contest.
 * @public
 * @namespace
 */
export let Swimming = {
    /** @constant {number} */
    maxAge: 18,

    /**
     * @typedef {Object} SwimmingCalculation
     * @property {number} a - A sport type specific number required to calculate the score
     * @property {number} c - A sport type specific number required to calculate the score
     * @property {number} d - A sport type specific number required to calculate the score
     * @property {ConversionFactors} conversionFactor - An object containing information about conversion factors for all start classes
     */

    /**
     * @typedef {Object} SwimmingGenderData
     * @property {SwimmingCalculation} scoreCalculation - Information about the score calculation
     */

    /**
     * @typedef {Object} SwimmingSportData
     * @property {string} id - The id of the sport type
     * @property {string} name - The human readable name for the sport type
     * @property {number} category - The category of the sport type (eg. sprinting)
     * @property {string} unit - The human readable unit for the measurements (eg. m (meter))
     * @property {string} description - A description of the sport type. It may contain information about how to measure in this sport type.
     */

    /**
     * Returns a list of sport types associated with the ct athletics.
     * @returns {SwimmingSportData[]}
     */
    getSports: function () {
        return require('./../../../data/swimming/sports.json');
    },

    getScoreTable: function () {
        return require('./../../../data/swimming/score_table.json');
    },
    /**
     * Returns whether a given athlete can do the sport type with the id stID.
     * @param {Log} log - A log object
     * @param {Athlete} athlete - The Athlete
     * @param {string} stID - The string id of the sport type
     * @returns {{canDoSport, dataObject, log}}
     */
    canDoSportType: function (log, athlete, stID) {
        //collect information
        let baseInformation = _.find(this.getSports(), function (st) {
            return st.id === stID;
        });

        // check information
        if (!baseInformation) {
            log.error(stID + ' ist keine gültige Sport ID.');
            return {
                canDoSport: false,
                dataObject: undefined
            };
        }

        // filter information
        const genderInfo = athlete.isMale ? baseInformation.m : baseInformation.w;
        //noinspection JSUnresolvedVariable
        const handicapData = genderInfo.scoreCalculation.conversionFactor[athlete.handicap];

        const baseScoreTable = this.getScoreTable();

        const genderScoreInfo = athlete.isMale ? baseScoreTable.m : baseScoreTable.w;
        const scoreTable = genderScoreInfo[athlete.tableAge][stID];

        // save important information
        const dataObject = {
            stID: stID,
            name: baseInformation.name,
            category: baseInformation.category,
            unit: baseInformation.unit,
            genderInfo: genderInfo,
            scoreTable: scoreTable,
            conversionFactor: handicapData === undefined ? 1.0 : handicapData,
            conversionAddend: (athlete.handicap !== '0' && (stID === 'st_diving_push' || stID === 'st_diving')) ? 1.0 : 0.0
        };

        let canDoSport = true;

        // check age
        if (scoreTable === undefined) {
            log.warning(athlete.getFullName() + ' hat kein gültiges Alter für ' + baseInformation.name + '.');
            canDoSport = false;
        }

        return {
            canDoSport: canDoSport,
            dataObject: dataObject
        };
    },

    /**
     * Validates the data of an athlete and adds more information to it. A copy of the data is returned. Without the write_private_hash the data is just decrypted without a write-permission check.
     * @param {Log} log - A log object
     * @param {Athlete} athlete - The Athlete
     * @param {Account[]} accounts - A list of accounts used to decrypt
     * @param {boolean} requireSignature - Only decrypt data if the signature can be verified. Should be true for final certificate creation.
     * * @returns {object[]}
     */
    getValidData: function (log, athlete, accounts, requireSignature) {
        //get the plain data from the athlete (unencrypted)
        const plain = athlete.getPlain(log, accounts, requireSignature);

        // filter data with more then on point
        const tmpData = _.filter(plain, function (dataObject) {
            return _.max(dataObject.measurements.data) > 0;
        });

        // temporary store this in that
        const that = this; //TODO alternative?

        // Add information
        return filterUndefined(_.map(tmpData, function (dataObject) {
            //noinspection JSUnresolvedVariable
            let canDoSportObject = that.canDoSportType(log, athlete, dataObject.stID.data);

            // add measurement to general information
            if (canDoSportObject.dataObject !== undefined) {
                canDoSportObject.dataObject.measurements = dataObject.measurements.data;
            }
            return canDoSportObject.canDoSport ? canDoSportObject.dataObject : undefined;
        }));
    },

    /**
     * Returns whether an athlete is already finished.
     * @param {Log} log - A log object
     * @param {Athlete} athlete - The Athlete
     * @param {Account[]} accounts - A list of accounts used to decrypt
     * @param {boolean} requireSignature - Only decrypt data if the signature can be verified. Should be true for final certificate creation.
     * @returns {boolean}
     */
    validate: function (log, athlete, accounts, requireSignature) {
        // collect data
        const data = this.getValidData(log, athlete, accounts, requireSignature);

        // sort for categories
        const categories = [];
        for (let st in data) {
            categories[data[st].category] = true;
        }

        return 3 <= _.filter(categories, function (category) {
                return category;
            }).length;
    },

    /**
     * Calculates the score of one dataObject returned by the getValidData function.
     * @private
     * @param {object} dataObject - Object containing the data. The format is returned by getValidData.
     * @returns {number[]}
     */
    calculateOne: function (dataObject) {
        return _.map(dataObject.measurements, function (measurement) {
            const tmp_measurement = dataObject.conversionAddend + dataObject.conversionFactor * measurement;
            let score = 0;

            // select score from table
            for (let i = 0; i <= 14; i++) {
                if ((dataObject.unit === 'm' && tmp_measurement >= dataObject.scoreTable[i]) ||
                    (dataObject.unit !== 'm' && tmp_measurement <= dataObject.scoreTable[i])) {
                    score = i + 1;
                }
            }
            return score;
        });
    },

    /**
     * Calculates the score archived by a athlete. In case of incomplete data, the function will calculate as much as possible.
     * @param {Log} log - A log object
     * @param {Athlete} athlete - The Athlete
     * @param {Account[]} accounts - A list of accounts used to decrypt
     * @param {boolean} requireSignature - Only decrypt data if the signature can be verified. Should be true for final certificate creation.
     * @returns {number}
     */
    calculate: function (log, athlete, accounts, requireSignature) {
        // collect data
        const validData = this.getValidData(log, athlete, accounts, requireSignature);

        // get best score for each category
        const scores = [0, 0, 0, 0, 0, 0];
        for (let vd in validData) {
            const score = this.calculateOne(validData[vd]);
            const bestScore = _.max(score);
            const category = validData[vd].category;

            log.info(validData[vd].name + ': ' + validData[vd].measurements + validData[vd].unit + ' (' + score + ') -> ' + bestScore);

            if (scores[category] < bestScore) {
                scores[category] = bestScore;
            }
        }

        // take the three best categories
        return _.reduce(_.sortBy(scores, function (num) {
            return num;
        }).splice(3, 3), function (mem, num) {
            return mem + num;
        }, 0);
    },

    /**
     * Returns information about the ct swimming.
     * @returns {object}
     */
    getInformation: function () {
        return require('./../../../data/swimming/information.json');
    },

    /**
     * Returns the min. score for the different certificates.
     * @param {Log} log - A log object
     * @param {Athlete} athlete - The Athlete
     * @returns {undefined|number[]}
     */
    getCertificateInfo: function (log, athlete) {
        if (athlete.check(log) === false) {
            log.error('Athletenprüfung fehlgechlagen. Bitte überprüfen sie die Einstellungen des Athleten (' + athlete.getFullName() + ').');
            return undefined;
        }
        return [15, 27];
    },

    /**
     * Generates to certificate for an athlete
     * @public
     * @param {Log} log - A log object
     * @param {Athlete} athlete - The Athlete
     * @param {Account[]} accounts - A list of accounts used to decrypt
     * @param {boolean} requireSignature - Only decrypt data if the signature can be verified. Should be true for final certificate creation.
     * @returns {{score: number, certificate: number}}
     */
    generateCertificate: function (log, athlete, accounts, requireSignature) {
        const score = this.calculate(log, athlete, accounts, requireSignature);
        const certificateInfo = this.getCertificateInfo(log, athlete);

        let certificate = -1;

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