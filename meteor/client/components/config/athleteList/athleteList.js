import {currentCompID, competitions, dbReady} from "../config";
import {DBInterface} from "../../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../../imports/api/account_managment/AccountManager";

const groups = new ReactiveVar([]);
const readOnly = new ReactiveVar(false);

function registerGroupsHelper() {
    Tracker.autorun(function () {
        Meteor.f7.showIndicator();
        dbReady.depend();
        DBInterface.waitForReady(function () {
            const competitionID = currentCompID.get();
            if (!competitionID) return;
            DBInterface.getAthletesByCompetition(AccountManager.getAdminAccount().account, competitionID, function (data) {
                console.log(data);
                groups.set(data);

                readOnly.set(false);
                const comps = competitions.get();
                for (let competition in comps.readOnly) {
                    if (!comps.readOnly.hasOwnProperty(competition)) continue;
                    if (comps.readOnly[competition]._id == competitionID) readOnly.set(true);
                }

                Tracker.afterFlush(Meteor.f7.hideIndicator);
            });
        });
    });
}

Template.athleteList.helpers({
    groups: function () {
        return groups.get();
    },
    readOnly: function () {
        return readOnly.get();
    }
});

Template.athleteList.onRendered(function () {
    registerGroupsHelper();
});