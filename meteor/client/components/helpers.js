import {Server} from "../../imports/api/database/ServerInterface";
import {AccountManager} from "../../imports/api/accountManagement/AccountManager";

export let getAthletes = function getAthletes() {
    const group_account = AccountManager.getGroupAccount().account;
    if (!group_account) return [];
    return Server.athletes.getByAccounts(Meteor.input.log, [group_account], false);
};

export let arrayify = function (obj) {
    let result = [];
    for (let key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        const new_obj = obj[key];
        new_obj.old_object_name = key;
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

export function countTrue(list) {
    let counter = 0;

    for (let a in list) {
        if (!list.hasOwnProperty(a)) continue;
        if (list[a] == true) { //== true required because list[a] might be an object
            counter += 1;
        }
    }
    return counter;
}

//noinspection JSCheckFunctionSignatures
const indicatorUsages = new ReactiveVar(0);

export function showIndicator() {
    const currentUsages = Tracker.nonreactive(function () { return indicatorUsages.get(); });
    indicatorUsages.set(currentUsages+1);
}

export function hideIndicator() {
    const currentUsages = Tracker.nonreactive(function () { return indicatorUsages.get(); });
    const newValue = currentUsages-1;
    //noinspection JSCheckFunctionSignatures
    indicatorUsages.set(newValue > 0 ? newValue : 0);
}

Tracker.autorun(function () {
    const usages = indicatorUsages.get();
    if (!Meteor.f7) return;
    if (usages > 0)
        Meteor.f7.showIndicator();
    else
        Meteor.f7.hideIndicator();
});

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
Template.registerHelper('dec', function (i) {
    return --i;
});
Template.registerHelper('hasData', function (obj) {
    return Object.keys(obj).length > 0;
});
Template.registerHelper('isZero', function (num) {
    return parseInt(num) == 0;
});
Template.registerHelper('setReadOnly', function (bool) {
    return bool ? "disabled" : "";
});
Template.registerHelper('contains', function (arr, obj) {
    return lodash.includes(arr, obj);
});
Template.registerHelper('eq', function (a, b) {
    return a == b;
});
Template.registerHelper('and', function (a, b) {
    return a && b;
});
Template.registerHelper('add', function (a, b) {
    return a + b
});
Template.registerHelper('isUndefined', function (a) {
    return a === undefined;
});
Template.registerHelper('toSimplePopupData', function (data) {
    return {data: data};
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
    },
    'click .accordion-item': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        Meteor.f7.accordionToggle(event.target.closest(".accordion-item"));
        return false;
    },
    'keypress input': function (event) {
        if (event.keyCode == 13)
            event.target.blur();
    }
});