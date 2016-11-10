export {Athletics};

let Athletics = {
    getSports: function () {
        return require('./../../../data/athletics_sports.json');
    },


    validate: function (athlete) {
        var result = [];

        for (var sport in athlete.data) {
            if (sport.value > 0) {
                result.push(sport.id);
            }
        }


    },

    calculate: function (data) {

    },

    check_configuration: function (config_data) {

    },

    getInformation: function () {
        return require('./../../../data/athletics_information.json');
    },
};