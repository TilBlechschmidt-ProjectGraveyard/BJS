import {filterUndefined} from "./../general";

export let Swimming = {
    maxAge: 18,
    /**
     * @summary Returns a list of sport types associated with the ct athletics.
     * @returns {{id: string, name: string, category: number, unit: string, description: string}[]}
     */
    getSports: function () {
        return require('./../../../data/swimming/sports.json');
    },

    getScoreTable: function () {
        return require('./../../../data/swimming/score_table.json');
    },
    /**
     * @summary Returns whether a given athlete can do the sport type with the id stID.
     * @param log
     * @param athlete
     * @param {string} stID
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
     * @summary Validates the data of an athlete and adds more information to it. A copy of the data is returned. Without the write_private_hash the data is just decrypted without a write-permission check.
     * @param log
     * @param athlete
     * @param {object[]} accounts
     * * @param requireSignature
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
     * @summary Returns whether an athlete is already finished.
     * @param log
     * @param athlete
     * @param {object[]} accounts
     * @param requireSignature
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
     * @summary Calculates the score archived by a athlete. In case of incomplete data, the function will calculate as much as possible.
     * @param log
     * @param athlete
     * @param {object[]} accounts
     * @param requireSignature
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
     * @summary Returns information about the ct swimming.
     * @returns {object}
     */
    getInformation: function () {
        return require('./../../../data/swimming/information.json');
    },

    /**
     * @summary Returns the min. score for the different certificates.
     * @param log
     * @param athlete
     * @returns {undefined|number[]}
     */
    getCertificateInfo: function (log, athlete) {
        if (athlete.check(log) === false) {
            log.error('Athletenprüfung fehlgechlagen. Bitte überprüfen sie die Einstellungen des Athleten (' + athlete.getFullName() + ').');
            return undefined;
        }
        return [15, 27];
    },

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