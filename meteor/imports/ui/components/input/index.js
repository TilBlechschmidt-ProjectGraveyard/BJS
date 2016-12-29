import {Template} from "meteor/templating";
import "./index.html";
import "./index.css";
import {AccountManagement} from "../../../api/AccountManagement/index";
import {Log} from "../../../api/log";
import {DBInterface} from "../../../api/database/db_access";
import {arrayify} from "../../../startup/client/helpers";

Meteor.input = {};
Meteor.input.log = new Log();

function getAthletes() {
    const group_account = AccountManagement.retrieveAccounts().Gruppenleiter.account;
    if (!group_account) return [];
    return DBInterface.getAthletesOfAccounts(Meteor.input.log, [group_account], false);
}

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
    if (!page.params.athlete_id) {
        DBInterface.waitForReady(function () {
            const athletes = lodash.sortBy(getAthletes(), 'lastName');
            if (athletes[0])
                FlowRouter.go('/contest/' + athletes[0].id);
        });
    }

    Template.login.helpers({
        show_login: !AccountManagement.inputPermitted()
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
            const athlete = getAthleteByID(id);
            if (!athlete) return "";
            return getAthleteByID(id).getFullName();
        },
        athleteByID: function (id) {
            Meteor.login_deps.depend();
            let sportTypes = {};
            if (!AccountManagement.retrieveAccounts().Station.logged_in) {
                // Return all sport types
                //TODO Filter by ones that already have data
                sportTypes = lodash.map(DBInterface.getCompetitionSportTypes(),
                    DBInterface.getCompetitionType().getSportType);
            } else {
                // Return all sport types that can be written to with the current station account
                const stIDs = AccountManagement.retrieveAccounts().Station.account.score_write_permissions;
                for (let stID in stIDs) {
                    if (!stIDs.hasOwnProperty(stID)) continue;
                    stID = stIDs[stID];
                    sportTypes[stID] = DBInterface.getCompetitionType().getSportType(stID);
                }
            }

            const athlete = getAthleteByID(id);
            if (athlete == undefined) return {};
            // Add some fake measurements
            if (AccountManagement.retrieveAccounts().Station.account) {
                athlete.addMeasurement(new Log(), "st_long_jump", [0.1, 2.2, 0.6], AccountManagement.retrieveAccounts().Gruppenleiter.account, AccountManagement.retrieveAccounts().Station.account);
                athlete.addMeasurement(new Log(), "st_long_jump", [0.5, 5.5], AccountManagement.retrieveAccounts().Gruppenleiter.account, AccountManagement.retrieveAccounts().Station.account);
                athlete.addMeasurement(new Log(), "st_ball_200", [0.5, 5.5], AccountManagement.retrieveAccounts().Gruppenleiter.account, AccountManagement.retrieveAccounts().Station.account);
            }

            // Fetch the measurements
            const read_only_measurements = athlete.getPlain(new Log(), [AccountManagement.retrieveAccounts().Gruppenleiter.account], false);

            // Insert the read_only_measurements into the athlete object
            athlete.sportType = {};
            for (let measurement_block in read_only_measurements) {
                if (!read_only_measurements.hasOwnProperty(measurement_block)) continue;
                measurement_block = read_only_measurements[measurement_block];

                const stID = measurement_block.stID.data;
                if (!athlete.sportType[stID]) {
                    athlete.sportType[stID] = {};
                    athlete.sportType[stID].metadata = sportTypes[stID];
                }
                athlete.sportType[stID].measurements = lodash.map(measurement_block.measurements.data, function (measurement) {
                    return {read_only: true, value: measurement};
                });
            }

            athlete.sportType = arrayify(athlete.sportType);

            return athlete;
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

    Template.input.onRendered(function () {
        Meteor.f7 = new Framework7({
            swipePanel: 'left'
        });
    });

    Template.attempt.helpers({
        inc: function (i) {
            return ++i;
        },
        isReadOnly: function (measurement) {
            return measurement.read_only ? "disabled" : "";
        }
    })
};