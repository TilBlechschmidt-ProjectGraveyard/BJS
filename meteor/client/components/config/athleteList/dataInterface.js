import {currentCompID, forwardIcon, editMode} from "../config";
import {Server} from "../../../../imports/api/database/ServerInterface";
import {showIndicator, hideIndicator} from "../../helpers";
import {AccountManager} from "../../../../imports/api/accountManagement/AccountManager";
import {Athlete} from "../../../../imports/api/logic/athlete";
import {genUUID} from "../../../../imports/api/crypto/pwdgen";
import {Log} from "../../../../imports/api/log";

export const localGroups = new ReactiveVar([]);
export const athleteErrorState = new ReactiveVar({});
export const selectedAthlete = new ReactiveVar(undefined);

const defaultBirthYear = new Date().getFullYear() - 17;

let asyncUUID = undefined;


// Load athletes from storage
Tracker.autorun(async function () {
    const compID = currentCompID.get();
    const inEditMode = Tracker.nonreactive(function () {
        return editMode.get()
    });
    if (compID) {
        if (inEditMode) Meteor.f7.showPreloader("Daten laden");
        else showIndicator();
        //noinspection JSCheckFunctionSignatures
        localGroups.set([]);

        if (asyncUUID) Server.cancelAsyncRequest(asyncUUID);

        asyncUUID = await Server.athletes.getAsync(AccountManager.getAdminAccount().account, compID, false, false, function (athlete, last, entry) {
            if (entry.index == 0 && !inEditMode)
                hideIndicator();
            if (athlete === false) {
                Meteor.f7.alert("Es ist ein Fehler beim Laden der Athleten aufgetreten!", "Fehler");
                return;
            }
            athlete = Athlete.fromObject(Meteor.config.log, athlete);
            addRawAthlete(athlete, true);

            if (inEditMode) {
                document.getElementsByClassName('modal-title')[0].innerHTML = entry.index + "/" + entry.size;
            }

            if (last)
                refreshErrorState();
        }, function (entry) {
            if (entry.size == 0) hideIndicator();
            if (inEditMode) Meteor.f7.hidePreloader();
        });
    }
});

/**
 *
 * @param {string} [id]
 * @param {string} [firstName]
 * @param {string} [lastName]
 */
export function refreshErrorState(id, firstName, lastName) {
    // Calculate the group state
    let lgroups = localGroups.get();
    let errorLevel = 0;

    const errorStates = {};

    for (let group in lgroups) {
        if (!lgroups.hasOwnProperty(group)) continue;
        group = lgroups[group];

        let groupErrLevel = 0;
        for (let athlete in group.athletes) {
            if (!group.athletes.hasOwnProperty(athlete)) continue;
            const athleteLog = new Log();

            let athlete = group.athletes[athlete];
            if (id && athlete.id === id) {
                athlete.firstName = firstName;
                athlete.lastName = lastName;
            }

            athlete.check(athleteLog);
            const athleteMessage = athleteLog.getHighestLevelMessage();
            errorStates[athlete.id] = athleteMessage;
            if (athleteMessage.level > groupErrLevel) groupErrLevel = athleteMessage.level;
        }

        errorStates[group.id] = {level: groupErrLevel};
        if (groupErrLevel > errorLevel) errorLevel = groupErrLevel;
    }

    if (errorLevel > 0)
        forwardIcon.set({
            level: errorLevel,
            template: errorLevel == 1 ? "iconWarn" : "iconErr",
            data: {text: errorLevel == 1 ? "Einer der Athleten hat womöglich ungültige Daten" : "Einer der Athleten beinhaltet einen Fehler"}
        });
    else
        forwardIcon.set(undefined);

    //noinspection JSCheckFunctionSignatures
    athleteErrorState.set(errorStates);
}

// ------------------- ATHLETE RELATED FUNCTIONS -------------------

export function writeAthlete(athlete) {
    if (!editMode.get()) return;
    const admin = AccountManager.getAdminAccount();
    Server.athletes.write(admin.account, currentCompID.get(), athlete.encryptForDatabase(admin.account, admin.account), athlete.id);
    refreshErrorState();
}

export function addAthlete(gid) {
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

    const ct = Server.contest.getType(compID);

    addRawAthlete(new Athlete(Meteor.config.log, "", "", defaultBirthYear, undefined, lgroups[groupID].name, '0', ct.maxAge, ct, genUUID()));
}

export function addRawAthlete(athlete, skipWrite) {
    let gid;
    if (!groupExists(athlete.group)) gid = addGroup(athlete.group);
    else gid = getGroupIDByName(athlete.group);
    modifyGroup(gid, function (group) {
        group.athletes.push(athlete);
    });
    if (!skipWrite) writeAthlete(athlete);
    refreshErrorState();
}

export function modifyAthlete(id, callback) {
    if (!editMode.get()) return;
    const lgroups = localGroups.get();
    for (let group in lgroups) {
        if (!lgroups.hasOwnProperty(group)) continue;
        let athletes = lgroups[group].athletes;
        for (let athlete in athletes) {
            if (!athletes.hasOwnProperty(athlete)) continue;
            let a = athletes[athlete];
            if (a.id == id) {
                callback(a, group, athlete);
                writeAthlete(a);
                localGroups.set(lgroups);
                return;
            }
        }
    }
}

export function removeAthlete(id) {
    const lgroups = localGroups.get();
    let groupIndex, athleteIndex;
    outerLoop:
        for (let group in lgroups) {
            if (!lgroups.hasOwnProperty(group)) continue;
            let athletes = lgroups[group].athletes;
            for (let athlete in athletes) {
                if (!athletes.hasOwnProperty(athlete)) continue;
                let a = athletes[athlete];
                if (a.id == id) {
                    groupIndex = group;
                    athleteIndex = athlete;
                    break outerLoop;
                }
            }
        }
    Server.athletes.remove(AccountManager.getAdminAccount().account, currentCompID.get(), lgroups[groupIndex].athletes[athleteIndex].id);
    lgroups[groupIndex].athletes.splice(athleteIndex, 1);
    localGroups.set(lgroups);
    refreshErrorState();
}

// -------------------- GROUP RELATED FUNCTIONS --------------------

export function addGroup(name) {
    if (groupExists(name)) {
        Meteor.f7.alert("Eine Gruppe mit diesem Namen existiert bereits!", "Fehler");
    } else {
        const lgroups = localGroups.get();
        const id = genUUID();
        lgroups.push({name: name, athletes: [], collapsed: false, id: id});
        localGroups.set(lgroups);
        refreshErrorState();
        return id;
    }
}

export function modifyGroup(id, callback) {
    const lgroups = localGroups.get();
    for (let group in lgroups) {
        if (!lgroups.hasOwnProperty(group)) continue;
        if (lgroups[group].id === id) {
            callback(lgroups[group], group);
            localGroups.set(lgroups);
            return group;
        }
    }
}

export function removeGroup(id) {
    const contestID = currentCompID.get();

    // Tell the server we deleted all athletes
    const groupIndex = modifyGroup(id, function (group) {
        for (let athlete in group.athletes) {
            if (!group.athletes.hasOwnProperty(athlete)) continue;
            Server.athletes.remove(AccountManager.getAdminAccount().account, contestID, group.athletes[athlete].id);
        }
    });

    // Delete the group locally
    const lgroups = localGroups.get();
    lgroups.splice(groupIndex, 1);
    localGroups.set(lgroups);

    // Update the error states
    refreshErrorState();
}

export function renameGroup(id, newName) {
    if (groupExists(newName)) {
        Meteor.f7.alert("Eine Gruppe mit diesem Namen existiert bereits!", "Fehler");
    } else {
        modifyGroup(id, function (group) {
            group.name = newName;
            for (let athlete in group.athletes) {
                if (!group.athletes.hasOwnProperty(athlete)) continue;
                athlete = group.athletes[athlete];
                athlete.group = newName;
                writeAthlete(athlete);
            }
        });
    }
}

export function getGroupIDByName(name) {
    const lgroups = localGroups.get();
    for (let group in lgroups) {
        if (!lgroups.hasOwnProperty(group)) continue;
        if (lgroups[group].name === name)
            return lgroups[group].id;
    }
    return undefined;
}

export function groupExists(name) {
    const lgroups = localGroups.get();
    for (let group in lgroups) {
        if (!lgroups.hasOwnProperty(group)) continue;
        if (lgroups[group].name == name) return true;
    }
    return false;
}