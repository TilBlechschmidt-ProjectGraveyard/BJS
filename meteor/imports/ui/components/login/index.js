import './index.html';
import {AccountManagement} from "../../../api/AccountManagement/index";

let _deps = new Tracker.Dependency();

Template.registerHelper('arrayify', function (obj) {
    let result = [];
    for (let key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        const new_obj = obj[key];
        new_obj.name = key;
        result.push(new_obj);
    }
    return result;
});

Template.login.helpers({
    "accounts": function () {
        _deps.depend();
        return AccountManagement.retrieveAccounts();
    }
});

Template.login.events({
    'click .login-button': function (event) {
        event.preventDefault();

        const type = event.target.dataset.name;
        const password_input = document.getElementById(type + "_pwd");
        const password = password_input.value;

        const accounts = AccountManagement.retrieveAccounts();
        accounts[event.target.dataset.name].processing = true;
        AccountManagement.storeAccounts(accounts);
        _deps.changed();

        setTimeout(function () {
            AccountManagement.login(type, password, function (success, err) {
                if (!success) {
                    //TODO: Throw something at the user
                    Meteor.f7.alert(err, "Fehler");
                    password_input.value = "";
                }
                const accounts = AccountManagement.retrieveAccounts();
                accounts[type].processing = false;
                AccountManagement.storeAccounts(accounts);
                _deps.changed();
            });
        }, 100);
    },
    'click .logout-button': function (event) {
        event.preventDefault();

        AccountManagement.logout(event.target.dataset.name, function () {
            _deps.changed();
        });
    }
});