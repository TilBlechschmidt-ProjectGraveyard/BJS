import {Template} from "meteor/templating";
import "./index.html";
import "./index.css";
import {AccountManagement} from "../../../api/AccountManagement/index";
import {Log} from "../../../api/log";
import {DBInterface} from "../../../api/database/db_access";

function getAthletes() {
    const log = new Log();
    const enforceSignature = AccountManagement.retrieveAccounts().Gruppenleiter.logged_in && AccountManagement.retrieveAccounts().Station.logged_in;
    return DBInterface.getAthletesOfAccounts(log, [AccountManagement.retrieveAccounts().Gruppenleiter.account], enforceSignature);
}

function getAthleteIDs() {
    return lodash.map(lodash.sortBy(getAthletes(), 'lastName'), function (athlete) {
        return athlete.id;
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
        athleteByID: function (id) {
            Meteor.login_deps.depend();
            const athletes = getAthletes();
            return _.find(athletes, function (a) {
                return a.id == id;
            });
        },
        getSportTypes: function () {
            Meteor.login_deps.depend();
            if (!AccountManagement.retrieveAccounts().Station.logged_in) {
                // Return all sport types
                //TODO Filter by active ones and ones that already have data
                return DBInterface.getCompetitionType().getSports();
            } else {
                // Return all sport types that can be written to with the current station account
                return lodash.map(AccountManagement.retrieveAccounts().Station.account.score_write_permissions,
                    DBInterface.getCompetitionType().getSportType);
            }
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
};