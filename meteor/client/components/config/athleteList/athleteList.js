import {currentCompID, editMode, forwardIcon} from "../config";
import {DBInterface} from "../../../../imports/api/database/DBInterface";
import {Log} from "../../../../imports/api/log";
import {AccountManager} from "../../../../imports/api/account_managment/AccountManager";
import {Athlete} from "../../../../imports/api/logic/athlete";
import {genUUID} from "../../../../imports/api/crypto/pwdgen";
import gender from "gender-guess";
import {showIndicator, hideIndicator} from "../../helpers";

const startClasses = require('../../../../imports/data/start_classes.json');
const defaultBirthYear = new Date().getFullYear() - 17;

export const localGroups = new ReactiveVar([]);
export const athleteErrorState = new ReactiveVar({});
export const selectedAthlete = new ReactiveVar(undefined);

const nameFilter = new ReactiveVar([]);

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

function getGroupIDByName(name) {
    const lgroups = localGroups.get();
    for (let group in lgroups) {
        if (!lgroups.hasOwnProperty(group)) continue;
        if (lgroups[group].name === name)
            return lgroups[group].id;
    }
    return undefined;
}

function groupExists(name) {
    const lgroups = localGroups.get();
    for (let group in lgroups) {
        if (!lgroups.hasOwnProperty(group)) continue;
        if (lgroups[group].name == name) return true;
    }
    return false;
}

function createGroup(name) {
    const lgroups = localGroups.get();
    const id = genUUID();
    lgroups.push({name: name, athletes: [], collapsed: false, id: id});
    localGroups.set(lgroups);
    return id;
}

function checkAthleteName(id, newName) {
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
    // athleteErrorState
}
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

        errorStates[group.name] = {level: groupErrLevel};
        if (groupErrLevel > errorLevel) errorLevel = groupErrLevel;
    }

    // Set the error level of the group
    if (!id && !firstName && !lastName) {
        lgroups = localGroups.get();
        for (let group in lgroups) {
            if (!lgroups.hasOwnProperty(group)) continue;
            lgroups[group].errorLevel = errorStates[lgroups[group].name].level;
        }
        localGroups.set(lgroups);
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

// Load from storage
Tracker.autorun(function () {
    const compID = currentCompID.get();
    if (compID) {
        showIndicator();
        //noinspection JSCheckFunctionSignatures
        localGroups.set([]);
        DBInterface.getAthletesByCompetition(AccountManager.getAdminAccount().account, compID, false, false, function (data) {
            for (let group in data) {
                if (!data.hasOwnProperty(group)) continue;
                group = data[group];
                group.id = genUUID();
                group.collapsed = false;
            }
            localGroups.set(data);
            refreshErrorState();
            hideIndicator();
        });

        Tracker.nonreactive(refreshErrorState);
        loaded = compID;
    }
});

// Save to storage
Tracker.autorun(function () {
    const compID = currentCompID.get();
    if (loaded == compID) {
        const lgroups = localGroups.get();
        const adminAccount = AccountManager.getAdminAccount().account;
        const encryptedAthletes = [];
        for (let group in lgroups) {
            if (!lgroups.hasOwnProperty(group)) continue;
            group = lgroups[group];
            for (let athlete in group.athletes) {
                if (!group.athletes.hasOwnProperty(athlete)) continue;
                athlete = group.athletes[athlete];
                encryptedAthletes.push(athlete.encryptForDatabase(adminAccount, adminAccount));
            }
        }
        DBInterface.writeAthletes(adminAccount, compID, encryptedAthletes);
    }
});

Template.athleteList.helpers({
    groups: function () {
        const nFilter = nameFilter.get();
        return _.map(localGroups.get(), function (group) {
            return {
                name: group.name,
                id: group.id,
                collapsed: group.collapsed,
                errorLevel: group.errorLevel,
                athletes: _.filter(group.athletes, function (athlete) {
                    const fullName = athlete.getFullName();
                    for (let filter in nFilter) {
                        if (!nFilter.hasOwnProperty(filter)) continue;
                        if (fullName.indexOf(nFilter[filter]) == -1) return false;
                    }
                    return true;
                })
            };
        });
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
        const errorState = athleteErrorState.get()[athlete.id];
        return errorState ? errorState.level : undefined;
    },
    athleteTooltipMsg: function (athlete) {
        const errorState = athleteErrorState.get()[athlete.id];
        return errorState ? errorState.message : undefined;
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
        refreshErrorState();
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
        refreshErrorState();
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
        refreshErrorState();
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
        refreshErrorState();
    },
    'keyup input.name-input': function (event) {
        const id = event.target.closest("li").dataset.id;
        const name = event.target.value;
        const firstName = name.split(' ').slice(0, -1).join(' ').trim();
        const lastName = name.split(' ').slice(-1).join(' ').trim();
        refreshErrorState(id, firstName, lastName);
    },
    'keyup #configAthletesSearch': function (event) {
        nameFilter.set(event.target.value.split(' '));
    },
    'click input': function (event) {
        if (editMode.get()) {
            event.stopImmediatePropagation();
            event.preventDefault();
            event.target.focus();
            return false;
        }
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
        refreshErrorState();
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
            refreshErrorState();
        });
    },
    'click .add-group': function (event) {
        Meteor.f7.prompt('Wähle einen Namen für die Gruppe', 'Gruppe erstellen', function (value) {
            if (groupExists(value)) {
                Meteor.f7.alert("Eine Gruppe mit diesem Namen existiert bereits!", "Fehler");
            } else {
                createGroup(value);
            }
            refreshErrorState();
        }).querySelector("input").focus();
    },
    'click .rename-group': function (event) {
        const gid = event.target.closest("[data-gid]").dataset.gid;
        Meteor.f7.prompt('Wähle einen neuen Namen für die Gruppe', 'Gruppe umbenennen', function (newName) {
            if (groupExists(newName)) {
                Meteor.f7.alert("Eine Gruppe mit diesem Namen existiert bereits!", "Fehler");
            } else {
                modifyGroup(gid, function (group) {
                    group.name = newName;
                });
            }
            refreshErrorState();
        }).querySelector("input").focus();
    },
    'click .remove-group': function (event) {
        const gid = event.target.closest("[data-gid]").dataset.gid;
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
            refreshErrorState();
        });
    },
    'click .collapse-group': function (event) {
        event.stopImmediatePropagation();
        const gid = event.target.closest("[data-gid]").dataset.gid || event.target.closest("li").dataset.gid;
        modifyGroup(gid, function (group) {
            if (!group.collapsed) {
                // Collapse accordions
                const accordion = document.querySelector("#athlete-list-" + gid + " li.accordion-item-expanded");
                if (accordion)
                    Meteor.f7.accordionClose(accordion);
            }
            group.collapsed = !group.collapsed;
        });
        const spans = $(".groupTitle-" + gid + " span");
        spans.fadeToggle(300);
    }
});

function findIndexByRegex(headerFields, regex) {
    return lodash.findIndex(headerFields, function (field) {
        const regexRes = field.match(regex);
        return regexRes !== null ? regexRes.length > 0 : false;
    });
}

function hasDuplicates(a) {
    return _.uniq(a).length !== a.length;
}

function correlateHeaders(headerFields) {
    const firstname = findIndexByRegex(headerFields, /(vor|tauf|ruf|first|fore|given|christian)/gi);

    const lastname = findIndexByRegex(headerFields, /(nach|eigen|familien|vater|last|sur|family)/gi);

    const ageGroup = findIndexByRegex(headerFields, /(alter|geburt|jahr|generation|stufe|geb|age|year|birth|life)/gi);

    const gender = findIndexByRegex(headerFields, /(geschlecht|gattung|sex|gender)/gi);

    const group = findIndexByRegex(headerFields, /(gruppe|klasse|verband|gesell|team|verein|gemein|bund|mannschaft|group|col)/gi);

    const headerIndices = [firstname, lastname, ageGroup, gender, group];
    if (hasDuplicates(headerIndices))
        console.warn("Duplicate header fields @ CSV File");

    return {
        firstName: headerFields[firstname],
        lastName: headerFields[lastname],
        ageGroup: headerFields[ageGroup],
        gender: headerFields[gender],
        group: headerFields[group]
    };
}

Template.csvImport.events({
    'change input[type=file]#csv-upload': function (event) {
        const files = event.target.files;
        for (let file in files) {
            if (!files.hasOwnProperty(file)) continue;
            file = files[file];
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    const compID = currentCompID.get();
                    const ct = DBInterface.getCompetitionType(compID);
                    const field = correlateHeaders(results.meta.fields);
                    for (let data in results.data) {
                        if (!results.data.hasOwnProperty(data)) continue;
                        data = results.data[data];
                        const gender = data[field["gender"]];
                        const athlete = new Athlete(Meteor.config.log, data[field["firstName"]], data[field["lastName"]], parseInt(data[field["ageGroup"]]), gender.match(/m/gi) !== null, data[field["group"]], '0', ct.maxAge, ct);
                        let gid;
                        if (!groupExists(athlete.group)) gid = createGroup(athlete.group);
                        else gid = getGroupIDByName(athlete.group);
                        modifyGroup(gid, function (group) {
                            group.athletes.push(athlete);
                        });
                    }
                    refreshErrorState();
                },
            });
        }
    }
});