import {CONTEST_TYPES} from "../../../../imports/api/logic/contestType";


Template.contestTypeInformationPopups.helpers({
    getInformation: function () {
        return _.map(CONTEST_TYPES, function (ct) {
            return ct.object.getInformation();
        })
    }
});