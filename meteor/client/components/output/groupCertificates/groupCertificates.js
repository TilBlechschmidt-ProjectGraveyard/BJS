import {reloadSwiper} from "../output";
function containsAthlete(arr) {
    for (let athlete in arr) {
        if (!arr.hasOwnProperty(athlete)) continue;
        if (Object.keys(arr[athlete]).length > 0) return true;
    }
    return false;
}

Template.groupCertificates.helpers({
    containsAthletes: containsAthlete,
    notContainsAthletes: function (arr) {
        return !containsAthlete(arr);
    }
});

Template.groupCertificates.onRendered(function () {
    reloadSwiper();
});