import {currentCompID, forwardIcon, editMode} from "../config";
import {Server} from "../../../../imports/api/database/ServerInterface";
import {showIndicator, hideIndicator} from "../../helpers";
import {AccountManager} from "../../../../imports/api/accountManagement/AccountManager";
import {Athlete} from "../../../../imports/api/logic/athlete";
import {genUUID} from "../../../../imports/api/crypto/pwdgen";
import {Log} from "../../../../imports/api/log";

export let LocalAthletes = {};
export let LocalGroups = {};
export const LocalGroupIDs = new ReactiveVar([]);

export const athleteErrorState = new ReactiveVar({});
export const selectedAthlete = new ReactiveVar(undefined);

const defaultBirthYear = new Date().getFullYear() - 17;

let asyncUUID = undefined;


// Load athletes from storage
Tracker.autorun(async function () {
    const compID = currentCompID.get();
    if (compID) {
        showIndicator();
        //noinspection JSCheckFunctionSignatures
        LocalAthletes = {};
        LocalGroups = {};
        LocalGroupIDs.set([]);

        if (asyncUUID) Server.cancelAsyncRequest(asyncUUID);

        asyncUUID = await Server.athletes.getAsync(AccountManager.getAdminAccount().account, compID, false, false, function (athlete, last, entry) {
            if (entry.index == 0)
                hideIndicator();
            if (athlete === false) {
                Meteor.f7.alert("Es ist ein Fehler beim Laden der Athleten aufgetreten!", "Fehler");
                return;
            }
            athlete = Athlete.fromObject(Meteor.config.log, athlete);
            addRawAthlete(athlete, true);

            if (last)
                refreshErrorState();
        }, function (entry) {
            if (entry.size == 0)
                hideIndicator();
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
    const localGroupIDs = LocalGroupIDs.get();
    let errorLevel = 0;

    const errorStates = {};

    for (let index in localGroupIDs) {
        if (!localGroupIDs.hasOwnProperty(index)) continue;
        const id = localGroupIDs[index];
        const group = LocalGroups[id].get();

        let groupErrLevel = 0;
        for (let athleteIndex in group.athletes) {
            if (!group.athletes.hasOwnProperty(athleteIndex)) continue;
            const athleteIndex = group.athletes[athleteIndex];
            const athlete = LocalAthletes[athleteIndex].get();
            const athleteLog = new Log();

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
    const ct = Server.contest.getType(compID);
    const aid = genUUID();

    const localGroup = LocalGroups[gid].get();
    LocalAthletes[aid] = new ReactiveVar(new Athlete(Meteor.config.log, "", "", defaultBirthYear, undefined, localGroup.name, '0', ct.maxAge, ct, aid));

    localGroup.athletes.push(aid);
    LocalGroups[gid].set(localGroup);
}

export function addRawAthlete(athlete, skipWrite) {
    let gid;
    if (!groupExists(athlete.group)) gid = addGroup(athlete.group);
    else gid = getGroupIDByName(athlete.group);

    LocalAthletes[athlete.id] = new ReactiveVar(athlete);
    const group = LocalGroups[gid].get();
    group.athletes.push(athlete.id);
    LocalGroups[gid].set(group);

    if (!skipWrite) writeAthlete(athlete);
    refreshErrorState();
}

export function modifyAthlete(id, callback) {
    const athlete = LocalAthletes[id].get();
    callback(athlete, LocalGroups[getGroupIDByName(athlete.group)].get(), athlete);
    writeAthlete(athlete);
    LocalAthletes[id].set(athlete);
}

export function removeAthlete(id) {
    const groupName = LocalAthletes[id].get().group();
    delete LocalAthletes[id];

    for (let gid in LocalGroups) {
        if (!LocalGroups.hasOwnProperty(gid)) continue;
        const group = LocalGroups[gid].get();
        if (group.name != groupName) continue;
        group.athletes.splice(group.athletes.indexOf(id), 0);
        LocalGroups[gid].set(group);
    }

    Server.athletes.remove(AccountManager.getAdminAccount().account, currentCompID.get(), id);
    refreshErrorState();
}

// -------------------- GROUP RELATED FUNCTIONS --------------------

export function addGroup(name) {
    if (groupExists(name)) {
        Meteor.f7.alert("Eine Gruppe mit diesem Namen existiert bereits!", "Fehler");
    } else {
        const gid = genUUID();

        LocalGroups[gid] = new ReactiveVar({name: name, id: gid, athletes: []});

        const localGroupIDs = LocalGroupIDs.get();
        localGroupIDs.push(gid);
        LocalGroupIDs.set(localGroupIDs);
        refreshErrorState();
        return gid;
    }
}

export function modifyGroup(gid, callback) {
    const group = LocalGroups[gid].get();
    callback(lgroups[group], group);
    LocalGroups[gid].set(group);
}

export function removeGroup(id) {

    const contestID = currentCompID.get();
    const group = LocalGroups[id].get();

    for (let index in group.athletes) {
        if (!group.athletes.hasOwnProperty(index)) continue;
        delete LocalAthletes[group.athletes[index]];
        Server.athletes.remove(AccountManager.getAdminAccount().account, contestID, group.athletes[index]);
    }

    delete LocalGroups[id];

    const localGroupIDs = LocalGroupIDs.get();
    localGroupIDs.athletes.splice(localGroupIDs.athletes.indexOf(id), 0);
    LocalGroupIDs.set(localGroupIDs);

    // Update the error states
    refreshErrorState();
}

export function renameGroup(id, newName) {
    if (groupExists(newName)) {
        Meteor.f7.alert("Eine Gruppe mit diesem Namen existiert bereits!", "Fehler");
    } else {
        const group = LocalGroups[id].get();
        group.name = newName;
        LocalGroups[id].set(group);
        writeAthlete(athlete);
    }
}

export function getGroupIDByName(name) {
    for (let id in LocalGroups) {
        if (!LocalGroups.hasOwnProperty(id)) continue;
        if (LocalGroups[id].get().name === name) return id;
    }
    return undefined;
}

export function groupExists(name) {
    return getGroupIDByName(name) != undefined;
}