import {genRandomCode, genUUID} from "../../../../imports/api/crypto/pwdgen";
import {Crypto} from "../../../../imports/api/crypto/crypto";
import {Account} from "../../../../imports/api/logic/account";
import {currentCompID} from "../config";
import {localGroups} from "../athleteList/athleteList";
import {DBInterface} from "../../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../../imports/api/account_managment/AccountManager";
import {setPrintButton} from "./../config.js";


let totalProgress = 0;
const baseACStructure = [
    {name: "Gruppenpasswörter", codes: []},
    {name: "Stationspasswörter", codes: []},
    {
        name: "Eigene Zugangsdaten",
        codes: [
            {name: "Urkundenzugang", resultPermission: true, id: "results", custom: true}
        ]
    }
];

const progress = new ReactiveVar(undefined);
//noinspection JSCheckFunctionSignatures
export const codesClean = new ReactiveVar(false);
//noinspection JSCheckFunctionSignatures
export const accessCodes = new ReactiveVar(baseACStructure);


Tracker.autorun(function () {
    const prog = progress.get();
    if (!prog) return;
    Meteor.f7.setProgressbar(".generateCodes", prog, 400);
});

function getIndexOfCode(acodes, type, id, name) {
    let index = lodash.findIndex(acodes[type].codes, function (c) {
        return c.id == id;
    });
    if (index == -1 && name) {
        // Fallback for groups and stations since it would be a larger overhead
        // to actually find and get the ID <-> sportType/group correlation
        index = lodash.findIndex(acodes[type].codes, function (c) {
            return c.name == name;
        });
    }
    return index;
}

function upsertCode(code, type) {
    const acodes = accessCodes.get();
    const index = getIndexOfCode(acodes, type, code.id, code.name);
    if (index == -1)
        acodes[type].codes.push(code);
    else
        acodes[type].codes[index] = code;
    accessCodes.set(acodes);
}

function setCode(code, groups, sportTypes, resultPermission, adminPermission, custom) {
    if (custom) {
        // Custom account
        upsertCode(code, 2);
    } else if (groups !== undefined && groups.length > 0 && (sportTypes === undefined || sportTypes.length == 0) && !custom) {
        // Group account
        upsertCode(code, 0);
    } else if (sportTypes !== undefined && sportTypes.length > 0 && (groups === undefined || groups.length == 0) && !resultPermission && !adminPermission && !custom) {
        // Station account
        upsertCode(code, 1);
    } else {
        // Custom account
        upsertCode(code, 2);
    }
}

function createAccount(name, groups, sportTypes, resultPermission, adminPermission, custom, id) {
    if (!id) id = genUUID();
    setCode({id: id, name: name}, groups, sportTypes, resultPermission, adminPermission, custom);

    const password = genRandomCode();

    const account = new Account(name, groups, sportTypes, Crypto.generateAC(password), resultPermission, adminPermission);

    setCode({
        id: id,
        name: name,
        account: account,
        code: password,
        groups: groups,
        sportTypes: sportTypes,
        resultPermission: resultPermission,
        adminPermission: adminPermission
    }, groups, sportTypes, resultPermission, adminPermission, custom);
}

function processCodes(codes) {
    //noinspection JSCheckFunctionSignatures
    progress.set((totalProgress - codes.length) / totalProgress * 100);
    if (codes.length > 0) {
        const code = codes.pop();
        setTimeout(function () { // TODO: Find a better solution to de-lag the browser whilst this is happenin'
            createAccount(code.name, code.groups, code.sportTypes, code.resultPermission, code.adminPermission, code.custom, code.id);
            processCodes(codes);
        }, 200);
    } else {
        //noinspection JSCheckFunctionSignatures
        codesClean.set(true);
        Meteor.f7.hidePreloader();
    }
}

function generateAccessCodes() {

    const sportTypes = getCurrentSportTypes();

    const codes = [];
    const customAccounts = accessCodes.get()[2].codes;

    // Station accounts
    for (let sportType in sportTypes) {
        if (!sportTypes.hasOwnProperty(sportType)) continue;
        sportType = sportTypes[sportType];
        codes.push({
            name: sportType.name,
            groups: [],
            sportTypes: [sportType.id],
            resultPermission: false,
            adminPermission: false
        });
    }

    // Group accounts
    const lgroups = localGroups.get();
    for (let group in lgroups) {
        if (!lgroups.hasOwnProperty(group)) continue;
        codes.push({
            name: lgroups[group].name,
            groups: [lgroups[group].name],
            sportTypes: [],
            resultPermission: false,
            adminPermission: false
        });
    }

    // Custom accounts
    const customAccountCodes = [];
    for (let customAccount in customAccounts) {
        if (!customAccounts.hasOwnProperty(customAccount)) continue;
        customAccountCodes.push(customAccounts[customAccount]);
    }

    Meteor.f7.showPreloader("Generiere Zugangscodes");
    totalProgress = codes.length;
    processCodes(codes.concat(customAccountCodes.reverse()));
}

function finalizeContest() {
    const compID = currentCompID.get();
    // TODO: Check validity of athletes

    // Get a list of accounts
    const acodes = accessCodes.get();
    const accounts = lodash.map(acodes[0].codes.concat(acodes[1].codes).concat(acodes[2].codes), function (code) {
        return code.account;
    });

    // Get a list of athletes
    const admin = AccountManager.getAdminAccount();
    const lgroups = localGroups.get();
    let athletes = [];
    setPrintButton(false);
    for (let group in lgroups) { // Loop through groups containing athletes for encryption
        if (!lgroups.hasOwnProperty(group)) continue;
        group = lgroups[group];
        for (let accountGroup in acodes[0].codes) { // Loop through groups (with accounts) to find the corresponding account
            if (!acodes[0].codes.hasOwnProperty(accountGroup)) continue;
            accountGroup = acodes[0].codes[accountGroup];
            if (group.name == accountGroup.name) {
                athletes = athletes.concat(lodash.map(group.athletes, function (athlete) { // Encrypt the athletes using the account
                    return athlete.encryptForDatabase(accountGroup.account, accountGroup.account);
                }));
                break;
            }
        }
    }

    DBInterface.writeAccounts(admin.account, compID, accounts, function () {
        console.log("Accounts written successfully");
    });

    DBInterface.writeAthletes(admin.account, compID, athletes, function () {
        console.log("Athletes written successfully");
    });

    DBInterface.lockCompetition(admin.account, compID, function () {
        console.log("Locked competition successfully");
    });

    setTimeout(function () {
        Meteor.f7.hidePreloader();
        document.getElementById("config-swiper").swiper.slideTo(0);
        localStorage.removeItem("config-groups-" + compID);
        accessCodes.set(baseACStructure);
        codesClean.set(false);
        localGroups.set([]);
        currentCompID.set("");
    }, 500);
}

function getCurrentSportTypes() {
    const compID = currentCompID.get();
    const competitionType = DBInterface.getCompetitionType(compID);
    return lodash.map(DBInterface.getCompetitionSportTypes(compID), function (stID) {
        return competitionType.getSportType(stID);
    });
}

Template.accessCodes.helpers({
    codeGroups: function () {
        return accessCodes.get().slice(0, -1); // Slice to remove the custom codes since they have a group on their own
    },
    customCodesGroup: function () {
        return accessCodes.get().slice(-1)[0];
    },
    progressDone: function () {
        return progress.get() == 100;
    },
    codesClean: function () {
        return codesClean.get();
    },
    get_competition_name: function () {
        const CurrentComp = DBInterface.getContestByID(currentCompID.get());
        if (CurrentComp !== undefined) {
            return CurrentComp.name;
        } else
            return '';
    },
    login_stations: function () {
        const ACs = accessCodes.get();
        return  ACs[1].codes;
    },
    login_groups: function () {
        const ACs = accessCodes.get();
        return  ACs[0].codes;
    },
    login_custom: function () {
        const ACs = accessCodes.get();
        return  ACs[2].codes;
    },
    sportTypes: getCurrentSportTypes
});

export function getCompetitionName() {
    const CurrentComp = DBInterface.getContestByID(currentCompID.get());
    if (CurrentComp !== undefined) {
        return CurrentComp.name;
    } else
        return '';
};
export function loginStations() {
    const ACs = accessCodes.get();
    return  ACs[1].codes;
};
export function loginGroups() {
    const ACs = accessCodes.get();
    return  ACs[0].codes;
};
export function loginCustom() {
    const ACs = accessCodes.get();
    return  ACs[2].codes;
};
Template.accessCodeGroup.helpers({
    otherPermissions: function () {
        return [
            {id: "resultPermission", name: "Urkunden erstellen"},
            {id: "adminPermission", name: "Administratorzugriff"}
        ];
    },
    otherPermissionList: function (code) {
        const otherPermissions = [];
        if (code.adminPermission) otherPermissions.push("adminPermission");
        if (code.resultPermission) otherPermissions.push("resultPermission");
        return otherPermissions;
    },
});

Template.accordionInnerListBlock.helpers({
    isChecked: function (checklist, id) {
        return lodash.includes(checklist, id) ? "checked" : "";
    }
});

Template.accordionInnerListBlock.events({
    'click .permission-input': function (event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        const stid = event.target.closest("li[data-stid]").dataset.stid;
        const id = event.target.closest("li[data-id]").dataset.id;
        const acodes = accessCodes.get();
        const index = getIndexOfCode(acodes, 2, id);
        const code = acodes[2].codes[index];
        code.account = undefined;
        code.custom = true;
        code.code = undefined;
        if (stid == "resultPermission") {
            code.resultPermission = !code.resultPermission;
        } else if (stid == "adminPermission") {
            code.adminPermission = !code.adminPermission;
        } else {
            if (lodash.includes(code.sportTypes, stid)) {
                code.sportTypes.splice(code.sportTypes.indexOf(stid), 1);
            } else if (code.sportTypes === undefined) {
                code.sportTypes = [stid];
            } else {
                code.sportTypes.push(stid);
            }
        }

        acodes[2].codes[index] = code;
        accessCodes.set(acodes);
        //noinspection JSCheckFunctionSignatures
        codesClean.set(false);

        return false;
    }
});

Template.accessCodes.events({
    'click .add-code': function (event) {
        Meteor.f7.prompt("Wählen sie einen Namen für den Zugangscode", "Zugangscode erstellen", function (name) {
            //noinspection JSCheckFunctionSignatures
            codesClean.set(false);
            upsertCode({
                id: genUUID(),
                name: name,
                custom: true,
                sportTypes: [],
                resultPermission: false,
                adminPermission: false
            }, 2);
        }).querySelector("input").focus();
    },
    'click .generateCodes': function (event) {
        setPrintButton(true);
        if (codesClean.get()) {
            Meteor.f7.confirm("Nach der Fertigstellung können sie den Wettkampf nichtmehr editieren und die Passwörter nichtmehr einsehen! Sind sie sicher, dass sie fortfahren wollen?", "Warnung", function () {
                Meteor.f7.showPreloader("Speichere Wettkampf");
                finalizeContest();
            });
        } else {
            generateAccessCodes();
        }
    }
});

Template.accessCodes.onRendered(function () {
    //noinspection JSCheckFunctionSignatures
    codesClean.set(false);
    //noinspection JSCheckFunctionSignatures
    progress.set(100);
});

// Template.accessCodes.animations({
//     ".item": {
//         container: ".container", // container of the ".item" elements
//         insert: {
//             class: "fade-open", // class applied to inserted elements
//             before: function (attrs, element, template) {
//             }, // callback before the insert animation is triggered
//             after: function (attrs, element, template) {
//             }, // callback after an element gets inserted
//             // delay: 500 // Delay before inserted items animate
//         },
//         remove: {
//             class: "fade-out", // class applied to removed elements
//             before: function (attrs, element, template) {
//                 console.log("hiding");
//             }, // callback before the remove animation is triggered
//             after: function (attrs, element, template) {
//                 console.log("hidden");
//             }, // callback after an element gets removed
//             // delay: 500 // Delay before removed items animate
//         },
//         animateInitial: true, // animate the elements already rendered
//         animateInitialStep: 200, // Step between animations for each initial item
//         animateInitialDelay: 500 // Delay before the initial items animate
//     }
// });