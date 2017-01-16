import {filterUndefined} from "./../general";


let CERTIFICATE_INFO = require('./../../../data/gymnastics/certificateInfo.json');

/**
 * Object containing all information and functions required for Athletics contest.
 * @public
 * @namespace
 */
export let Gymnastics = {
    /** @constant {number} */
    maxAge: 19,

    /**
     * @typedef {Object} AthleticsSportData
     * @property {string} id - The id of the sport type
     * @property {string} name - The human readable name for the sport type
     * @property {number} category - The category of the sport type (eg. sprinting)
     * @property {string} unit - The human readable unit for the measurements (eg. m (meter))
     * @property {string} description - A description of the sport type. It may contain information about how to measure in this sport type.
     * @property {number[]} age - A list of ages which are allowed to participate
     */

    /**
     * Returns a list of sport types associated with the ct gymnastics.
     * @public
     * @returns {AthleticsSportData[]}
     */
    getSports: function () {
        return require('./../../../data/gymnastics/sports.json');
    },

    /**
     * Returns the SportType by its id
     * @param {string} stID - The id of the sport type
     * @return {object|undefined}
     */
    getSportType: function (stID) {
        const data = Gymnastics.getSports();

        for (let d in data) {
            if (!data.hasOwnProperty(d)) continue;
            if (data[d].id === stID) return data[d];
        }
        return undefined;
    },

    /**
     * Returns the name of a SportType
     * @param {string} stID - The id of the sport type
     * @return {string}
     */
    getNameOfSportType: function (stID) {
        const sport_type = Gymnastics.getSportType(stID);
        if (sport_type) return sport_type.name;
        else return "Unknown";
    },

    /**
     * Returns whether a given athlete can do the sport type with the id stID.
     * @public
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

        // save important information
        const dataObject = {
            stID: stID,
            name: baseInformation.name,
            category: baseInformation.category,
            unit: baseInformation.unit,
            age: baseInformation.age
        };

        let canDoSport = true;

        // check age
        if (_.indexOf(dataObject.age, athlete.tableAge) == -1) {
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
     * @public
     * @param {Log} log - A log object
     * @param {Athlete} athlete - The Athlete
     * @param {Account[]} accounts - A list of accounts used to decrypt
     * @param {boolean} requireSignature - Only decrypt data if the signature can be verified. Should be true for final certificate creation.
     * @returns {object[]}
     */
    getValidData: function (log, athlete, accounts, requireSignature) {
        //get the plain data from the athlete (unencrypted)
        const plain = athlete.getPlain(log, accounts, requireSignature);

        //filter data with more then one point
        const tmpData = _.filter(plain, function (dataObject) {
            return dataObject.measurement.data;
        });

        // temporary store this in that
        const that = this; //TODO alternative?

        //Add information
        return filterUndefined(_.map(tmpData, function (dataObject) {
            //noinspection JSUnresolvedVariable
            let canDoSportObject = that.canDoSportType(log, athlete, dataObject.stID.data);

            // add measurement to general information
            if (canDoSportObject.dataObject !== undefined) {
                canDoSportObject.dataObject.measurement = dataObject.measurement.data;
            }
            return canDoSportObject.canDoSport ? canDoSportObject.dataObject : undefined;
        }));
    },

    /**
     * Returns whether an athlete is already finished.
     * @public
     * @param {Log} log - A log object
     * @param {Athlete} athlete - The Athlete
     * @param {Account[]} accounts - A list of accounts used to decrypt
     * @param {boolean} requireSignature - Only decrypt data if the signature can be verified. Should be true for final certificate creation.
     * @returns {boolean}
     */
    validate: function (log, athlete, accounts, requireSignature) {
        // collect data
        const validData = this.getValidData(log, athlete, accounts, requireSignature);

        // sort for categories
        const categories = [false, false, false, false, false, false];
        for (let st in validData) {
            if (!validData.hasOwnProperty(st)) continue;
            categories[validData[st].category] = true;
        }

        return (3 <= _.filter(categories.slice(0, -1), function (category) {
                return category;
            }).length) && categories[5];
    },

    /**
     * Calculates the score achieved by an athlete. In case of incomplete data, the function will calculate as much as possible.
     * @public
     * @param {Log} log - A log object
     * @param {Athlete} athlete - The Athlete
     * @param {Account[]} accounts - A list of accounts used to decrypt
     * @param {boolean} requireSignature - Only decrypt data if the signature can be verified. Should be true for final certificate creation.
     * @returns {{score: number, stScores: object}}
     */
    calculate: function (log, athlete, accounts, requireSignature) {
        // collect data
        const validData = this.getValidData(log, athlete, accounts, requireSignature);

        // get best score for each category
        const scores = [0, 0, 0, 0, 0, 0];
        const stScores = {};
        for (let vd in validData) {
            if (!validData.hasOwnProperty(vd)) continue;
            const score = validData[vd].measurement;
            const category = validData[vd].category;

            if (!stScores.hasOwnProperty(validData[vd].stID)) {
                stScores[validData[vd].stID] = 0;
            }
            if (stScores[validData[vd].stID] < score) {
                stScores[validData[vd].stID] = score;
            }

            log.info(validData[vd].name + ': ' + validData[vd].measurements + validData[vd].unit + ' -> ' + score);

            if (scores[category] < score) {
                scores[category] = score;
            }
        }

        // take the three best categories
        return {
            score: _.reduce(_.sortBy(scores.slice(0, -1), function (num) {
                return num;
            }).splice(1, 3), function (mem, num) {
                return mem + num;
            }, 0) + scores[5],
            stScores: stScores
        };

    },

    /**
     * Returns information about the contest type gymnastics.
     * @public
     * @returns {object}
     */
    getInformation: function () {
        return require('./../../../data/gymnastics/information.json');
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

        return CERTIFICATE_INFO[athlete.tableAge];
    },

    /**
     * Generates the certificate for an athlete
     * @public
     * @param {Log} log - A log object
     * @param {Athlete} athlete - The Athlete
     * @param {Account[]} accounts - A list of accounts used to decrypt
     * @param {boolean} requireSignature - Only decrypt data if the signature can be verified. Should be true for final certificate creation.
     * @returns {{score: number, certificate: number}}
     */
    generateCertificate: function (log, athlete, accounts, requireSignature) {
        const calculateResult = this.calculate(log, athlete, accounts, requireSignature);
        const certificateInfo = this.getCertificateInfo(log, athlete);

        let certificate = -1;

        if (certificateInfo !== undefined) {
            if (calculateResult.score >= certificateInfo[1]) {
                certificate = 2;
            } else if (calculateResult.score >= certificateInfo[0]) {
                certificate = 1;
            } else {
                certificate = 0;
            }
        }

        return {
            score: calculateResult.score,
            stScores: calculateResult.stScores,
            certificate: certificate
        };
    }
};