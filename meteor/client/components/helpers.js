import {DBInterface} from "../../imports/api/database/db_access";
import {AccountManager} from "../../imports/api/account_managment/AccountManager";

export let getAthletes = function getAthletes() {
    const group_account = AccountManager.getGroupAccount().account;
    if (!group_account) return [];
    return DBInterface.getAthletesOfAccounts(Meteor.input.log, [group_account], false);
};

export let arrayify = function (obj) {
    let result = [];
    for (let key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        const new_obj = obj[key];
        new_obj.name = key;
        result.push(new_obj);
    }
    return result;
};

export let tryDecrypt = function (string) {
    try {
        return atob(string);
    } catch (e) {
        return false;
    }
};

export let invertLogin = function (group) {
    return group == "Gruppenleiter" ? "Station" : "Gruppenleiter";
};

export let getLastLogin = function () {
    if (!sessionStorage.getItem("firstLogin")) return "";
    return invertLogin(sessionStorage.getItem("firstLogin"));
};

export let triggerDefaultModalAction = function () {
    const modal = document.querySelectorAll('body > div.modal.modal-in')[0];
    if (!modal) return false;
    const defaultButton = modal.querySelector("div.modal-buttons > .modal-button-bold");
    defaultButton.click();
    return true;
};

export function isOffline() {
    const time = new Date().getTime();
    const connected = Meteor.status().connected;
    if (Meteor.pageVisitTime + 1000 < time) {
        return !connected;
    } else {
        return false;
    }
}

// export let registerHelpers = function () {
Meteor.pageVisitTime = new Date().getTime();

Template.registerHelper('arrayify', arrayify);
Template.registerHelper('not', function (b) {
    return !b;
});
Template.registerHelper('isEmpty', function (arr) {
    if (arr === undefined) return true;
    return arr.length === 0;
});
Template.registerHelper('isNotEmpty', function (arr) {
    if (arr === undefined) return true;
    return arr.length !== 0;
});
Template.registerHelper('length', function (arr) {
    return arr.length;
});
Template.registerHelper('inc', function (i) {
    return ++i;
});
Template.registerHelper('hasData', function (obj) {
    return Object.keys(obj).length > 0;
});
Template.registerHelper('isOffline', isOffline);

Template.body.events({
    'keypress': function (event) {
        if (event.keyCode == 13)
            triggerDefaultModalAction();
    },
    'click': function (event) {
        if (event.target.tagName !== "INPUT")
            event.target.blur();
    }
});
// }