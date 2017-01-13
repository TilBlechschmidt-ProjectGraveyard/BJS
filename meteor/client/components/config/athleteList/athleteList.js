import {currentCompID, editMode, dbReady} from "../config";
import {DBInterface} from "../../../../imports/api/database/DBInterface";
import {Log} from "../../../../imports/api/log";
import {AccountManager} from "../../../../imports/api/account_managment/AccountManager";
import {Athlete} from "../../../../imports/api/logic/athlete";
import {genUUID} from "../../../../imports/api/crypto/pwdgen";
import gender from "gender-guess";

const startClasses = require('../../../../imports/data/start_classes.json');
const defaultBirthYear = new Date().getFullYear() - 17;

const groups = new ReactiveVar([]);
export const localGroups = new ReactiveVar([]);
export const selectedAthlete = new ReactiveVar(undefined);

let loaded;

export let modifyAthlete = function (id, callback) {
    const lgroups = localGroups.get();
    for (let group in lgroups) {
        if (!lgroups.hasOwnProperty(group)) continue;
        let athletes = lgroups[group].athletes;
        for (let athlete in athletes) {
            if (!athletes.hasOwnProperty(athlete)) continue;
            let a = athletes[athlete];
            if (a.id == id) {
                callback(a, group, athlete);
                localGroups.set(lgroups);
                return;
            }
        }
    }
};

export let modifyGroup = function (id, callback) {
    const lgroups = localGroups.get();
    for (let group in lgroups) {
        if (!lgroups.hasOwnProperty(group)) continue;
        if (lgroups[group].id === id) {
            callback(lgroups[group], group);
            localGroups.set(lgroups);
            return;
        }
    }
};

// Load from storage
Tracker.autorun(function () {
    const compID = currentCompID.get();
    if (compID) {
        const stored = localStorage.getItem("config-groups-" + compID);
        if (stored) {
            const parsed = JSON.parse(stored);
            for (let group in parsed) {
                if (!parsed.hasOwnProperty(group)) continue;
                parsed[group].collapsed = false;
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
        if (Meteor.f7) Meteor.f7.showIndicator(); // TODO This doesn't get shown
        if (!DBInterface.isReady()) return;
        dbReady.depend();
        DBInterface.waitForReady(function () {
            const competitionID = currentCompID.get();
            if (!competitionID) {
                if (Meteor.f7) Meteor.f7.hideIndicator();
                return;
            }
            DBInterface.getAthletesByCompetition(AccountManager.getAdminAccount().account, competitionID, function (data) {
                groups.set(data);
                Tracker.afterFlush(function () {
                    if (Meteor.f7) Meteor.f7.hideIndicator();
                });
            });
        });
    });
});

function athleteTooltip(athlete) {
    if (editMode.get()) {
        const log = new Log();
        athlete.check(log);
        const msg = log.getLastMessage();
        if (msg == undefined) return {};
        return log.getLastMessage();
    } else
        return {};
}

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
    },
    athleteTooltipLevel: function (athlete) {
        return athleteTooltip(athlete).level;
    },
    athleteTooltipMsg: function (athlete) {
        return athleteTooltip(athlete).message;
    },
    fullName: function (athlete) {
        if (editMode.get()) {
            const fullName = athlete.getFullName();
            if (fullName === " ") return;
            return fullName;
        }
    },
    startClassName: function (startClass) {
        return startClasses[startClass].name;
    }
});

Template.athleteList.events({
    'keyup .ageGroup': function (event) {
        event.stopImmediatePropagation();
        const id = event.target.closest("li").dataset.id;
        modifyAthlete(id, function (athlete) {
            athlete.ageGroup = parseInt(event.target.value);
        });
    },
    'mousewheel .ageGroup': function (event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        const e = event.originalEvent;
        const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        const id = event.target.closest("li").dataset.id;
        modifyAthlete(id, function (athlete) {
            athlete.ageGroup = athlete.ageGroup + delta;
        });
        return false;
    },
    'click .gender': function (event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        const id = event.target.closest("li").dataset.id;
        const isMale = lodash.includes(event.target.className, 'gender-male');
        modifyAthlete(id, function (athlete) {
            athlete.isMale = isMale;
        });
        return false;
    },
    'click .startClassSelectOpen': function (event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        const id = event.target.closest("li").dataset.id;
        modifyAthlete(id, function (athlete) { //Abuse the function to get the athlete data
            selectedAthlete.set(athlete);
        });
        Meteor.f7.popup(".popup-startclass");
        return false;
    },
    'blur input.name-input': function (event) {
        const id = event.target.closest("li").dataset.id;
        const name = event.target.value;
        const firstName = name.split(' ').slice(0, -1).join(' ').trim();
        const lastName = name.split(' ').slice(-1).join(' ').trim();
        modifyAthlete(id, function (athlete) {
            if (athlete.isMale === undefined) {
                const genderGuess = gender.guess(firstName);
                if (genderGuess !== undefined && typeof genderGuess.gender === 'string' && genderGuess.confidence > 0.96) athlete.isMale = genderGuess.gender == "M";
            }
            athlete.firstName = firstName;
            athlete.lastName = lastName;
        });
    },
    'click input': function (event) {
        if (editMode.get()) {
            event.stopImmediatePropagation();
            event.preventDefault();
            event.target.focus();
            return false;
        }
    },
    'click .add-group': function (event) {
        Meteor.f7.prompt('Wähle einen Namen für die Gruppe', 'Gruppe erstellen', function (value) {
            const lgroups = localGroups.get();
            lgroups.push({name: value, athletes: [], collapsed: false, id: genUUID()});
            localGroups.set(lgroups);
        }).querySelector("input").focus();
    },
    'click .add-athlete': function (event) {
        const gid = event.target.closest(".add-athlete").dataset.id;
        const compID = currentCompID.get();
        const lgroups = localGroups.get();
        let groupID;
        for (let group in lgroups) {
            if (!lgroups.hasOwnProperty(group)) continue;
            if (lgroups[group].id === gid) {
                groupID = group;
                break;
            }
        }

        const ct = DBInterface.getCompetitionType(compID);
        lgroups[groupID].athletes.push(new Athlete(Meteor.config.log, "", "", defaultBirthYear, undefined, lgroups[groupID].name, '0', ct.maxAge, ct, genUUID()));

        localGroups.set(lgroups);
    },
    'click .remove-athlete': function (event) {
        event.stopImmediatePropagation();
        const id = event.target.closest("li").dataset.id;
        Meteor.f7.confirm('Wollen sie den Athleten wirklich endgültig löschen?', 'Athleten löschen', function () {
            let groupIndex, athleteIndex;
            modifyAthlete(id, function (a, gIndex, aIndex) {
                groupIndex = gIndex;
                athleteIndex = aIndex;
            });
            if (groupIndex && athleteIndex) {
                const lgroups = localGroups.get();
                lgroups[groupIndex].athletes.splice(athleteIndex, 1);
                localGroups.set(lgroups);
            }
        });
    },
    'click .rename-group': function (event) {
        const gid = event.target.dataset.gid;
        Meteor.f7.prompt('Wähle einen neuen Namen für die Gruppe', 'Gruppe umbenennen', function (newName) {
            modifyGroup(gid, function (group) {
                group.name = newName;
            });
        }).querySelector("input").focus();
    },
    'click .remove-group': function (event) {
        const gid = event.target.dataset.gid;
        Meteor.f7.confirm('Wollen sie die Gruppe samt ihrer Athleten endgültig löschen?', 'Gruppe löschen', function () {
            let groupIndex;
            const lgroups = localGroups.get();
            for (let group in lgroups) {
                if (!lgroups.hasOwnProperty(group)) continue;
                if (lgroups[group].id == gid) {
                    groupIndex = group;
                }
            }
            lgroups.splice(groupIndex, 1);
            localGroups.set(lgroups);
        });
    },
    'click .collapse-group': function (event) {
        event.stopImmediatePropagation();
        const gid = event.target.dataset.gid || event.target.closest("li").dataset.gid;
        modifyGroup(gid, function (group) {
            group.collapsed = !group.collapsed;
        });
        const spans = $(".groupTitle-" + gid + " span");
        spans.fadeToggle(300);
    }
});