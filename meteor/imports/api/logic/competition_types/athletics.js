export {Athletics};

let lang = require('./../../../data/athletics/lang_de.json');

let Athletics = {
    /**
     * Returns a list of sport types associated with athletics.
     * @returns {{id: string, name: string, category: number, description: string, age_w: number[], age_m: number[]}[]}
     */
    getSports: function () {
        return require('./../../../data/athletics/sports.json');
    },


    /**
     * Validates the data of an athlete and adds more information to it. A copy of the data is returned.
     * @param athlete
     * @returns {Array}
     */
    getValidData: function (athlete) {
        let sports = this.getSports(); //TODO add age and handicap check

        return _.map(_.filter(athlete.data, function (data_value) {
            return data_value.measurement > 0;
        }), function (data_value) {
            var base_information = _.find(sports, function (st) {
                return st.id == data_value.st_id;
            });
            return {
                st_id: data_value.st_id,
                category: base_information.category,
                measurement: data_value.measurement
            };
        });
    },

    validate: function (athlete) {
        var validData = this.getValidData(athlete);
        var categories = [false, false, false, false];
        for (var st in validData) {
            categories[validData[st].category] = true;
        }

        return 3 <= _.filter(categories, function (category) {
                return category;
            }).length;
    },

    calculate: function (data) {

    },

    check_configuration: function (config_data) {

    },

    getInformation: function () {
        return require('./../../../data/athletics/information.json');
    },
};