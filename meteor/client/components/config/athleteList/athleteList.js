import {currentCompID, editMode, dbReady} from "../config";
import {DBInterface} from "../../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../../imports/api/account_managment/AccountManager";
import {Athlete} from "../../../../imports/api/logic/athlete";

const groups = new ReactiveVar([]);
const localGroups = new ReactiveVar([]);

let loaded;

// Load from storage
Tracker.autorun(function () {
    const compID = currentCompID.get();
    if (compID) {
        const stored = localStorage.getItem("config-groups-" + compID);
        if (stored) {
            const parsed = JSON.parse(stored);
            for (let group in parsed) {
                if (!parsed.hasOwnProperty(group)) continue;
                parsed[group].athletes = lodash.map(parsed[group].athletes, function (athlete) {
                    return Athlete.fromObject(Meteor.config.log, athlete);
                });
            }
            localGroups.set(parsed);
        }
        loaded = compID;
    }
});

// Save to storage
Tracker.autorun(function () {
    const compID = currentCompID.get();
    if (loaded == compID) {
        const lgroups = localGroups.get();
        localStorage.setItem("config-groups-" + compID, JSON.stringify(lgroups));
    }
});

DBInterface.waitForReady(function () {
    Tracker.autorun(function () {
        Meteor.f7.showIndicator();
        dbReady.depend();
        DBInterface.waitForReady(function () {
            const competitionID = currentCompID.get();
            if (!competitionID) return;
            DBInterface.getAthletesByCompetition(AccountManager.getAdminAccount().account, competitionID, function (data) {
                // Tracker.nonreactive(function () {
                //     // Remove duplicated groups from the localGroups object
                //     const lgroups = localGroups.get();
                //     lodash.remove(lgroups, function (group) {
                //         for (let g in data) {
                //             if (!data.hasOwnProperty(g)) continue;
                //             if (group.name == data[g].name) return false;
                //         }
                //         return true;
                //     });
                //     localGroups.set(lgroups);
                // });
                groups.set(data);
                Tracker.afterFlush(Meteor.f7.hideIndicator);
            });
        });
    });
});

Template.athleteList.helpers({
    groups: function () {
        if (editMode.get())
            return localGroups.get();
        else
            return groups.get();
    },
    readOnly: function () {
        return !editMode.get();
    },
    validAthlete: function (athlete) {
        if (editMode.get())
            return athlete.check(Meteor.config.log);
        else
            return true;
    }
});

Template.athleteList.events({
    'click input': function () {
        if (editMode.get()) {
            event.stopImmediatePropagation();
            event.preventDefault();
            event.target.focus();
            return false;
        }
    },
    'click .add-group': function () {
        Meteor.f7.prompt('Wähle einen Namen für die Gruppe', 'Gruppe erstellen', function (value) {
            const lgroups = localGroups.get();
            lgroups.push({name: value, athletes: []});
            localGroups.set(lgroups);
        });
    },
    'click .add-athlete': function (event) {
        const groupName = event.target.closest(".add-athlete").dataset.id;
        const compID = currentCompID.get();
        const lgroups = localGroups.get();
        let groupID;
        for (let group in lgroups) {
            if (!lgroups.hasOwnProperty(group)) continue;
            if (lgroups[group].name === groupName) {
                groupID = group;
                break;
            }
        }

        const ct = DBInterface.getCompetitionType(compID);
        lgroups[groupID].athletes.push(new Athlete(Meteor.config.log, "", "", 2000, true, groupName, '0', ct.maxAge, ct));

        localGroups.set(lgroups);
    }
});