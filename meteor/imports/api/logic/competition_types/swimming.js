import {filterUndefined} from "./../general";

export let Swimming = {
    maxAge: 18,
    /**
     * Returns a list of sport types associated with the ct athletics.
     * @returns {{id: string, name: string, category: number, unit: string, description: string}[]}
     */
    getSports: function () {
        return require('./../../../data/swimming/sports.json');
    },

    getScoreTable: function () {
        return require('./../../../data/swimming/score_table.json');
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

        var baseScoreTable = this.getScoreTable();

        let genderScoreInfo = athlete.isMale ? baseScoreTable.m : baseScoreTable.w;
        let scoreTable = genderScoreInfo[athlete.tableAge][stID];

        let dataObject = {
            stID: stID,
            name: baseInformation.name,
            category: baseInformation.category,
            unit: baseInformation.unit,
            genderInfo: genderInfo,
            scoreTable: scoreTable,
            conversionFactor: handicapData === undefined ? 1.0 : handicapData,
            conversionAddend: (athlete.handicap !== "0" && (stID === "st_diving_push" || stID === "st_diving")) ? 1.0 : 0.0
        };

        var canDoSport = true;

        if (scoreTable === undefined) {
            log.warning(athlete.getFullName() + " hat kein gültiges Alter für " + baseInformation.name + ".");
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
    }
};