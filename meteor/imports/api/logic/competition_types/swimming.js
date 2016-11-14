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
};