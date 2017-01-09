import {genRandomCode} from "../../../../imports/api/crypto/pwdgen";
import {Crypto} from "../../../../imports/api/crypto/crypto";
import {Account} from "../../../../imports/api/logic/account";
import {currentCompID} from "../config";
import {localGroups} from "../athleteList/athleteList";
import {DBInterface} from "../../../../imports/api/database/DBInterface";

let totalProgress = 0;
const progress = new ReactiveVar(undefined);
const accessCodes = new ReactiveVar([
    {name: "Gruppenpasswörter", codes: []},
    {name: "Stationspasswörter", codes: []},
    {name: "Eigene Zugangsdaten", codes: []}
]);

Tracker.autorun(function () {
    const prog = progress.get();
    if (!prog) return;
    Meteor.f7.setProgressbar(".generateCodes", prog, 400);
});

function upsertCode(code, name, type) {
    const acodes = accessCodes.get();
    const index = lodash.findIndex(acodes[type].codes, function (code) {
        return code.title == name;
    });
    if (index == -1)
        acodes[type].codes.push(code);
    else
        acodes[type].codes[index] = code;
    accessCodes.set(acodes);
}

function setCode(code, name, groups, sportTypes, resultPermission, adminPermission) {
    if (groups.length > 0 && sportTypes.length == 0) {
        // Group account
        upsertCode(code, name, 0);
    } else if (sportTypes.length > 0 && !resultPermission && !adminPermission) {
        // Station account
        upsertCode(code, name, 1);
    } else {
        // Custom account
        upsertCode(code, name, 2);
    }
}

function createAccount(name, groups, sportTypes, resultPermission, adminPermission) {
    setCode({title: name}, name, groups, sportTypes, resultPermission, adminPermission);

    const password = genRandomCode();

    const account = new Account(name, groups, sportTypes, Crypto.generateAC(password), resultPermission, adminPermission);

    setCode({
        title: name,
        account: account,
        code: password
    }, name, groups, sportTypes, resultPermission, adminPermission);
}

function processCodes(codes) {
    console.log((totalProgress - codes.length) / codes.length * 100);
    progress.set((totalProgress - codes.length) / codes.length * 100);
    if (codes.length > 0) {
        const code = codes.pop();
        setTimeout(function () {
            createAccount(code.name, code.groups, code.sportTypes, code.resultPermission, code.adminPermission);
            processCodes(codes);
        }, 200);
    } else {
        Meteor.f7.hidePreloader();
    }
}

Template.accessCodes.helpers({
    codeGroups: function () {
        return accessCodes.get();
    },
    customCodesGroup: function () {
        return {
            name: "Eigene Zugangscodes",
            codes: [] //TODO Replace with data
        }
    },
    progressDone: function () {
        return progress.get() == 100;
    }
});

Template.accessCodes.events({
    'click .generateCodes': function () {
        const compID = currentCompID.get();
        const competitionType = DBInterface.getCompetitionType(compID);
        const sportTypes = lodash.map(DBInterface.getCompetitionSportTypes(compID), function (stID) {
            return competitionType.getSportType(stID);
        });

        const codes = [];

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

        Meteor.f7.showPreloader("Generiere Zugangscodes");
        totalProgress = codes.length;
        processCodes(codes);
    }
});

Template.accessCodes.onRendered(function () {
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