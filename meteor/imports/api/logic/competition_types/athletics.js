export {Athletics};

let lang = require('./../../../data/athletics/lang_de.json');

let Athletics = {
    getSports: function () {
        return require('./../../../data/athletics/sports.json');
    },


    getValidData: function (athlete) {
        let sports = this.getSports(); //TODO alternative?

        return _.map(_.filter(athlete.data, function (data_value) {
            return data_value.measurement > 0;
        }), function (data_value) {
            var base_information = _.find(sports, function (sp) {
                return sp.id == data_value.id;
            });
            return {
                id: data_value.id,
                category: base_information.category,
                measurement: data_value.measurement
            };
        });
    },

    validate: function (athlete) {
        var validData = this.getValidData(athlete);
        var categories = [false, false, false, false];
        for (var sp in validData) {
            categories[validData[sp].category] = true;
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