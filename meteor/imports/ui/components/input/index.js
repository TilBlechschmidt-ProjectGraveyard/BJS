import {Template} from "meteor/templating";
import "./index.html";
import "./index.css";
import {Log} from "../../../api/log";
import {DBInterface} from "../../../api/database/db_access";
import {arrayify, getAthletes, selectDefaultAthlete} from "../../../startup/client/helpers";
import {InputAccountManager} from "../../../api/account_managment/InputAccountManager";

Meteor.input = {};
Meteor.input.log = new Log();

const input_deps = new Tracker.Dependency();
let canNotDoSportType = [];
const canNotDoSportType_deps = new Tracker.Dependency();

function getAthleteIDs() {
    return lodash.map(lodash.sortBy(getAthletes(), 'lastName'), function (athlete) {
        return athlete.id;
    });
}

function getAthleteByID(id) {
    return _.find(getAthletes(), function (a) {
        return a.id == id;
    });
}

export let input_onload = function (page) {

    Template.login.helpers({
        show_login: !InputAccountManager.inputPermitted() || !InputAccountManager.viewPermitted()
    });

    Template.input.helpers({
        athletes: function () {
            Meteor.login_deps.depend();
            const athletes = lodash.sortBy(getAthletes(), 'lastName');

            let athlete_list = [];
            for (let athlete in athletes) {
                if (!athletes.hasOwnProperty(athlete)) continue;
                athlete = athletes[athlete];
                athlete_list.push({id: athlete.id, name: athlete.getFullName()});
            }

            return athlete_list;
        },
        nameByID: function (id) {
            Meteor.login_deps.depend();
            const athlete = getAthleteByID(id);
            if (!athlete) return "";
            return getAthleteByID(id).getFullName();
        },
        showCanNotDoSportType: function () {
            canNotDoSportType_deps.depend();
            return canNotDoSportType.length > 0;
        },
        canNotDoSportType: function () {
            canNotDoSportType_deps.depend();
            return canNotDoSportType;
        },
        athleteByID: function (id) {
            Meteor.login_deps.depend();
            input_deps.depend();

            if (!DBInterface.isReady()) {
                DBInterface.waitForReady(function () {
                    input_deps.changed();
                });
                return {};
            }
            let sportTypes = {};

            //load data
            const athlete = getAthleteByID(id);
            if (athlete === undefined) return {};

            const stationAccount = InputAccountManager.getStationAccount();
            const ct = DBInterface.getCompetitionType();


            canNotDoSportType = [];
            if (stationAccount.account) {
                for (let sportTypeIndex in stationAccount.account.score_write_permissions) {
                    let sportType = stationAccount.account.score_write_permissions[sportTypeIndex];
                    if (athlete.sports.indexOf(sportType) == -1) {
                        canNotDoSportType.push(ct.getSportType(sportType).name);
                    }
                }
            }
            canNotDoSportType_deps.changed();

            // Add all other sport types we don't have write permission for
            let all_sportTypes = lodash.map(athlete.sports, ct.getSportType);
            for (let index in all_sportTypes) {
                if (!all_sportTypes.hasOwnProperty(index)) continue;
                let sportType = all_sportTypes[index];
                sportTypes[sportType.id] = sportType;
            }

            // Fetch the measurements
            const read_only_measurements = athlete.getPlain(Meteor.input.log, [InputAccountManager.getGroupAccount().account], false);

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
                const measurements = JSON.parse(sessionStorage.getItem("measurements"))[id];
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

            console.log(athlete.sportType);

            return athlete;
        },
        isEmpty: function (arr) {
            if (arr === undefined) return true;
            return arr.length === 0;
        }
    });

    Template.attempts.helpers({
        length: function (arr) {
            return arr.length;
        },
        empty_measurement: {read_only: false, value: "", class: "add-attempt-input"},
        scoreWritePermission: function (metadata) {
            Meteor.login_deps.depend();
            return metadata.write_permission;
        }
    });

    Template.attempt.helpers({
        inc: function (i) {
            return ++i;
        },
        isReadOnly: function (measurement) {
            return measurement.read_only ? "disabled" : "";
        },
        athlete_id: function () {
            return FlowRouter.getParam("athlete_id");
        }
    });

    Template.input.events({
        'click li.athlete': function (event) {
            FlowRouter.go("/contest/" + event.target.closest("li").dataset.id);
            Meteor.f7.closePanel();
        },
        'click #link_prev': function () {
            const athleteIDs = getAthleteIDs();
            let prevAthleteID = athleteIDs.indexOf(FlowRouter.getParam("athlete_id")) - 1;
            if (prevAthleteID < 0) prevAthleteID = athleteIDs.length - 1;
            FlowRouter.go("/contest/" + athleteIDs[prevAthleteID]);
        },
        'click #link_next': function () {
            const athleteIDs = getAthleteIDs();
            let prevAthleteID = athleteIDs.indexOf(FlowRouter.getParam("athlete_id")) + 1;
            if (prevAthleteID > athleteIDs.length - 1) prevAthleteID = 0;
            FlowRouter.go("/contest/" + athleteIDs[prevAthleteID]);
        }
    });

    function updateMeasurement(athleteID, stID, attempt, measurement) {
        if (!athleteID || !stID || !attempt) return;
        if (!sessionStorage.getItem("measurements")) sessionStorage.setItem("measurements", "{}");

        const measurements = JSON.parse(sessionStorage.getItem("measurements"));
        if (measurements[athleteID] === undefined) measurements[athleteID] = {};
        if (measurements[athleteID][stID] === undefined) measurements[athleteID][stID] = {};

        if (measurements[athleteID][stID][attempt] == measurement) return false;

        if (measurement === "") {
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

    function hasClass(element, cls) {
        return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
    }

    Template.attempt.events({
        'keypress input': function (event) {
            if (event.keyCode == 13) {
                const data = event.target.dataset;
                event.preventDefault();
                event.stopImmediatePropagation();
                if (updateMeasurement(data.athleteId, data.stid, data.attempt, event.target.value) && hasClass(event.target, "add-attempt-input"))
                    event.target.value = "";

                input_deps.changed();
                event.stopPropagation();
                return false;
            }
        },
        'blur input': function (event) {
            const data = event.target.dataset;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (updateMeasurement(data.athleteId, data.stid, data.attempt, event.target.value) && hasClass(event.target, "add-attempt-input"))
                event.target.value = "";
            input_deps.changed();
        }
    });

    Template.input.onRendered(function () {
        Meteor.f7 = new Framework7({
            swipePanel: 'left'
        });

        selectDefaultAthlete();
    });
};
