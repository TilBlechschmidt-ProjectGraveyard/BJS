import {Server} from "../../../../imports/api/database/ServerInterface";
import {refreshAthletes} from "../input";


function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

function getAthleteIDByElement(element) {
    const parentSlide = element.closest("div.swiper-slide[data-hash]");
    if (!parentSlide) return "";
    return parentSlide.dataset.hash;
}

function updateMeasurement(athleteID, stID, attempt, strMeasurement) {
    if (!athleteID || !stID || !attempt) return;
    if (!sessionStorage.getItem("measurements")) sessionStorage.setItem("measurements", "{}");

    const measurements = JSON.parse(sessionStorage.getItem("measurements"));
    if (measurements[athleteID] === undefined) measurements[athleteID] = {};
    if (measurements[athleteID][stID] === undefined) measurements[athleteID][stID] = {};

    const ct = Server.contest.getType();

    const sportTypeData = ct.getSportType(stID);
    const strDotMeasurement = strMeasurement.replace(/,/g, ".");

    let measurement = 0;
    if (sportTypeData.unit === "min:s") {
        const res = strDotMeasurement.split(':');
        if (res.length >= 2) {
            measurement = parseFloat(res[0]) * 60 + parseFloat(res[1]);
        } else if (res.length == 1) {
            measurement = parseFloat(strDotMeasurement);
        }
    } else {
        measurement = parseFloat(strDotMeasurement);
    }

    if (measurements[athleteID][stID][attempt] == measurement) return false;

    if (strMeasurement === "") {
        const attempts = measurements[athleteID][stID];
        if (attempts.hasOwnProperty(attempt)) {
            delete measurements[athleteID][stID][attempt];

            const new_attempts = {};
            let shifted_att;
            for (let att in attempts) {
                if (!attempts.hasOwnProperty(att)) continue;
                if (parseFloat(att) > parseFloat(attempt)) {
                    shifted_att = parseFloat(att) - 1;
                } else {
                    shifted_att = parseFloat(att);
                }
                new_attempts[shifted_att] = attempts[att];
            }
            measurements[athleteID][stID] = new_attempts;
        }
    } else {
        measurements[athleteID][stID][attempt] = measurement;
    }

    sessionStorage.setItem("measurements", JSON.stringify(measurements));

    return true;
}

Template.attempt.helpers({
    disabledText: function (measurement) {
        return measurement.read_only ? "disabled" : "";
    }
});

Template.attempt.events({
    'keypress input': function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const data = event.target.dataset;
            if (updateMeasurement(getAthleteIDByElement(event.target), data.stid, data.attempt, event.target.value) && hasClass(event.target, "add-attempt-input"))
                event.target.value = "";

            refreshAthletes();
            event.stopPropagation();
            return false;
        }
    },
    'click .delete-attempt': function (event) {
        Meteor.f7.confirm("Wollen Sie den Eintrag wirklich löschen?", "Löschen", function () {
            let attempt_id = event.target.closest(".delete-attempt").dataset.id;
            let athlete_id = getAthleteIDByElement(event.target);

            const obj = {};
            obj["m_" + attempt_id] = "";
            
            Meteor.COLLECTIONS.Athletes.handle.update({_id: athlete_id}, {$unset: obj});
        });
    },
    'blur input': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const data = event.target.dataset;
        if (updateMeasurement(getAthleteIDByElement(event.target), data.stid, data.attempt, event.target.value) && hasClass(event.target, "add-attempt-input"))
            event.target.value = "";
        refreshAthletes();
    }
});
