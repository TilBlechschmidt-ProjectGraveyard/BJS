import {DBInterface} from "../../api/database/db_access";
import {AccountManager} from "../../api/account_managment/AccountManager";

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