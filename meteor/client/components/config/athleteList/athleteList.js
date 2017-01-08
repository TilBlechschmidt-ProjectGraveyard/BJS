import {currentCompID, editMode, dbReady} from "../config";
import {DBInterface} from "../../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../../imports/api/account_managment/AccountManager";

const groups = new ReactiveVar([]);

DBInterface.waitForReady(function () {
    Tracker.autorun(function () {
        Meteor.f7.showIndicator();
        dbReady.depend();
        DBInterface.waitForReady(function () {
            const competitionID = currentCompID.get();
            if (!competitionID) return;
            DBInterface.getAthletesByCompetition(AccountManager.getAdminAccount().account, competitionID, function (data) {
                groups.set(data);

                Tracker.afterFlush(Meteor.f7.hideIndicator);
            });
        });
    });
});

Template.athleteList.helpers({
    groups: function () {
        return groups.get();
    },
    readOnly: function () {
        return !editMode.get();
    }
});