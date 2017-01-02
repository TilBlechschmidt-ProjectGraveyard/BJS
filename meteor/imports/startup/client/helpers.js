import {DBInterface} from "../../api/database/db_access";
import {InputAccountManager} from "../../api/account_managment/InputAccountManager";

export let getAthletes = function getAthletes() {
    const group_account = InputAccountManager.getGroupAccount().account;
    if (!group_account) return [];
    return DBInterface.getAthletesOfAccounts(Meteor.input.log, [group_account], false);
};

export let selectDefaultAthlete = function () {
    DBInterface.waitForReady(function () {
        const athletes = lodash.sortBy(getAthletes(), 'lastName');
        if (((!FlowRouter.getParam("athlete_id") && athletes[0]) || !lodash.find(athletes, function (athlete) {
                return athlete.id == FlowRouter.getParam("athlete_id");
            })) && athletes[0] !== undefined) {
            FlowRouter.go('/contest/' + athletes[0].id);
            Meteor.inputDependency.depend();
        }
    });
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