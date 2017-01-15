import {currentCompID, dbReady} from "../config";
import {DBInterface} from "../../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../../imports/api/account_managment/AccountManager";

const categories = new ReactiveVar([]);

DBInterface.waitForReady(function () {
    Tracker.autorun(function () {
        if (Meteor.f7) Meteor.f7.showIndicator();
        dbReady.depend();

        const compID = currentCompID.get();
        console.log(compID);
        if (!compID) {
            console.log("---------ABORTED---------");
            if (Meteor.f7) Meteor.f7.hideIndicator();
            return;
        }

        const competition = Meteor.COLLECTIONS.Contests.handle.findOne({_id: compID});
        const competitionType = DBInterface.getCompetitionType(compID);
        const sportTypes = competitionType.getSports();
        const cats = lodash.map(competitionType.getInformation().categoryNames, function (name) {
            return {name: name, sportTypes: []};
        });

        for (let sportType in sportTypes) {
            if (!sportTypes.hasOwnProperty(sportType)) continue;
            sportType = sportTypes[sportType];

            // set enabled state for sportType
            if (lodash.includes(competition.sportTypes, sportType.id))
                sportType.checked = "checked";
            else
                sportType.checked = "";

            cats[sportType.category].sportTypes.push(sportType);
        }

        categories.set(cats);

        Tracker.afterFlush(function () {
            if (Meteor.f7) Meteor.f7.hideIndicator();
        });
    });
});

Template.sportTypeSelection.helpers({
    categories: function () {
        console.log("RELOAD TEMPLATE");
        return categories.get();
    }
});

Template.sportTypeSelection.events({
    'click .checkbox-sportType': function (event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        const label = event.target.closest("label");
        const checkbox = label.querySelector("input[type='checkbox']");
        const newValue = !checkbox.checked;

        DBInterface.setSportTypeState(AccountManager.getAdminAccount().account, currentCompID.get(), label.dataset.id, newValue);

        const cats = categories.get();
        for (let cat in cats) {
            if (!cats.hasOwnProperty(cat)) continue;

            const index = lodash.findIndex(cats[cat].sportTypes, function (a) {
                return a.id == label.dataset.id;
            });

            if (index > -1) {
                cats[cat].sportTypes[index].checked = newValue ? "checked" : undefined;
                break;
            }
        }
        categories.set(cats);
        return false;
    }
});