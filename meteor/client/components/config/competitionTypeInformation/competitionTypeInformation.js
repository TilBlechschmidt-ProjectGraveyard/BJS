import {COMPETITION_TYPES} from "../../../../imports/api/logic/competition_type";


Template.competitionTypeInformationPopups.helpers({
    getInformation: function () {
        return _.map(COMPETITION_TYPES, function (ct) {
            return ct.object.getInformation();
        })
    }
});