import {COMPETITION_TYPES} from "../../../../imports/api/logic/competition_type";


Template.competitionTypeInformationPopups.helpers({
    getInformation: function () {
        return _.map(COMPETITION_TYPES, function (ct) {
            console.log(ct.object.getInformation());
            return ct.object.getInformation();
        })
    }
});