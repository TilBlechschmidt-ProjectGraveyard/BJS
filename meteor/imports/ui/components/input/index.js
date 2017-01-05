import {Template} from "meteor/templating";
import "./index.html";
import "./index.css";
import {Log} from "../../../api/log";
import {DBInterface} from "../../../api/database/db_access";
import {arrayify, getAthletes, getLastLogin} from "../../../startup/client/helpers";
import {AccountManager} from "../../../api/account_managment/AccountManager";
import {checkPermission, updateSwiperProgress} from "../login/router";

Meteor.input = {};
Meteor.input.log = new Log();

Meteor.inputDependency = new Tracker.Dependency();

function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

function getAthleteIDByElement(element) {
    const parentSlide = element.closest("div.swiper-slide[data-hash]");
    if (!parentSlide) return "";
    return parentSlide.dataset.hash;
}

function populateAthlete(athlete) {
    if (!DBInterface.isReady()) {
        DBInterface.waitForReady(function () {
            Meteor.inputDependency.changed();
        });
        return {};
    }
    let sportTypes = {};

    if (athlete === undefined) return {};

    const stationAccount = AccountManager.getStationAccount();
    const ct = DBInterface.getCompetitionType();


    athlete.nonPermittedSportTypes = [];
    if (stationAccount.account) {
        for (let sportTypeIndex in stationAccount.account.score_write_permissions) {
            if (!stationAccount.account.score_write_permissions.hasOwnProperty(sportTypeIndex)) continue;
            let sportType = stationAccount.account.score_write_permissions[sportTypeIndex];
            if (athlete.sports.indexOf(sportType) == -1) {
                athlete.nonPermittedSportTypes.push(ct.getSportType(sportType).name);
            }
        }
    }

    if (stationAccount.logged_in) {
        // Return all sport types that can be written to with the current station account
        const stIDs = stationAccount.account.score_write_permissions;
        for (let stID in stIDs) {
            if (!stIDs.hasOwnProperty(stID) || !lodash.includes(athlete.sports, stIDs[stID])) continue;
            stID = stIDs[stID];
            sportTypes[stID] = DBInterface.getCompetitionType().getSportType(stID);
        }
    }

    // Add all other sport types we don't have write permission for but the athlete is permitted to perform
    let all_sportTypes = lodash.map(athlete.sports, ct.getSportType);
    for (let index in all_sportTypes) {
        if (!all_sportTypes.hasOwnProperty(index)) continue;
        let sportType = all_sportTypes[index];
        sportTypes[sportType.id] = sportType;
    }

    // Fetch the measurements
    const read_only_measurements = athlete.getPlain(Meteor.input.log, [AccountManager.getGroupAccount().account], false);

    athlete.sportType = {};
    let stID;

    // Insert the metadata for the sportTypes
    for (let index in sportTypes) {
        stID = sportTypes[index].id;
        if (!athlete.sportType[stID]) athlete.sportType[stID] = {};
        athlete.sportType[stID].metadata = sportTypes[index];
        athlete.sportType[stID].measurements = [];
    }

    // Insert the read_only_measurements into the athlete object
    for (let measurement_block in read_only_measurements) {
        if (!read_only_measurements.hasOwnProperty(measurement_block)) continue;
        measurement_block = read_only_measurements[measurement_block];

        stID = measurement_block.stID.data;
        if (athlete.sportType[stID].measurements === undefined) athlete.sportType[stID].measurements = [];
        athlete.sportType[stID].measurements = athlete.sportType[stID].measurements.concat(
            lodash.map(measurement_block.measurements.data, function (measurement) {
                return {read_only: true, value: measurement};
            })
        );
    }

    // Insert the read-write data from the current session
    if (stationAccount.account && sessionStorage.getItem("measurements")) {
        const measurements = JSON.parse(sessionStorage.getItem("measurements"))[athlete.id];
        for (let sportType in measurements) {
            if (!measurements.hasOwnProperty(sportType)) continue;
            const data = lodash.map(measurements[sportType], function (entry) {
                return {read_only: false, value: entry};
            });
            athlete.sportType[sportType].measurements = athlete.sportType[sportType].measurements.concat(data);
        }
    }

    athlete.sportType = arrayify(athlete.sportType);

    // Remove unused sportTypes (skipping the ones we have write permission for) and add a write_permission flag
    let write_permissions = [];
    if (stationAccount.account)
        write_permissions = stationAccount.account.score_write_permissions;

    athlete.sportType = lodash.map(athlete.sportType, function (element) {
        const write_permission = lodash.includes(write_permissions, element.metadata.id);
        if (write_permission || element.measurements.length > 0) {
            element.metadata.write_permission = write_permission;
            return element;
        }
    });

    athlete.sportType = lodash.remove(athlete.sportType, function (e) {
        return e !== undefined;
    });

    athlete.sportType = _.map(athlete.sportType, function (element) {
        if (element.metadata.unit === "min:s") {
            element.metadata.inputType = "text";
            for (let m in element.measurements) {
                if (!element.measurements.hasOwnProperty(m)) continue;
                const min = Math.floor(element.measurements[m].value / 60);
                const s = element.measurements[m].value - min * 60;
                if (s < 10) {
                    element.measurements[m].strValue = min + ":0" + s;
                } else {
                    element.measurements[m].strValue = min + ":" + s;
                }
            }
        } else {
            element.metadata.inputType = "number";
            for (let m in element.measurements) {
                if (!element.measurements.hasOwnProperty(m)) continue;
                element.measurements[m].strValue = element.measurements[m].value.toString();
            }
        }
        return element;
    });

    return athlete;
}

function updateMeasurement(athleteID, stID, attempt, strMeasurement) {
    if (!athleteID || !stID || !attempt) return;
    if (!sessionStorage.getItem("measurements")) sessionStorage.setItem("measurements", "{}");

    const measurements = JSON.parse(sessionStorage.getItem("measurements"));
    if (measurements[athleteID] === undefined) measurements[athleteID] = {};
    if (measurements[athleteID][stID] === undefined) measurements[athleteID][stID] = {};

    const ct = DBInterface.getCompetitionType();

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

//noinspection JSUnusedGlobalSymbols
Template.input.helpers({
    both_logged_in: function () {
        return AccountManager.inputPermitted();
    },
    last_login: function () {
        return getLastLogin();
    },
    athletes: function () {
        Meteor.inputDependency.depend();
        const athletes = lodash.sortBy(getAthletes(), 'lastName');

        return lodash.map(athletes, function (athlete) {
            return populateAthlete(athlete);
        });
    },
    sportTypes: function () {
        if (!DBInterface.isReady()) {
            const dbDep = new Tracker.Dependency();
            dbDep.depend();
            DBInterface.waitForReady(function () {
                dbDep.changed();
            });
            return [];
        }
        const competitionType = DBInterface.getCompetitionType();
        return lodash.map(DBInterface.getCompetitionSportTypes(), function (stID) {
            return competitionType.getSportType(stID);
        });
    }
});

Template.attempts.helpers({
    empty_measurement: {read_only: false, strValue: "", class: "add-attempt-input"},
    scoreWritePermission: function (metadata) {
        Meteor.inputDependency.depend();
        return metadata.write_permission;
    }
});

Template.attempt.helpers({
    isReadOnly: function (measurement) {
        return measurement.read_only ? "disabled" : "";
    },
});

Template.input.events({
    'click #link_next': function () {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.getElementById("input-swiper").swiper.slideNext();
        return false;
    },
    'click #link_prev': function () {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.getElementById("input-swiper").swiper.slidePrev();
        return false;
    },
    'click .logout-button': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.target.blur();
        AccountManager.logout(getLastLogin());
        Meteor.inputDependency.changed();
        return false;
    },
    'click .return-to-login': function () {
        event.preventDefault();
        event.stopImmediatePropagation();
        checkPermission();
        setTimeout(updateSwiperProgress, 1);
        return false;
    },
    'click .athlete-link': function () {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.getElementById("input-swiper").swiper.slideTo(parseFloat(event.target.dataset.target) + 1);
        Meteor.f7.closeModal();
        return false;
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

            Meteor.inputDependency.changed();
            event.stopPropagation();
            return false;
        }
    },
    'blur input': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const data = event.target.dataset;
        const parentSlide = event.target.closest("div.swiper-slide[data-hash]");
        if (updateMeasurement(getAthleteIDByElement(event.target), data.stid, data.attempt, event.target.value) && hasClass(event.target, "add-attempt-input"))
            event.target.value = "";
        Meteor.inputDependency.changed();
    }
});

Template.input.onRendered(function () {
    const nameSwiper = new Swiper('#input-name-swiper', {
        loop: true,
        effect: 'slide',
        spaceBetween: 50,
        onlyExternal: true
    });

    new Swiper('#input-swiper', {
        pagination: '.swiper-pagination',
        paginationType: 'fraction',
        hashnav: true,
        hashnavWatchState: true,
        replaceState: true,
        parallax: true,
        loop: true,
        observer: true,
        speed: 400,
        spaceBetween: 50,
        grabCursor: true,
        shortSwipes: true,
        control: nameSwiper
    });
});