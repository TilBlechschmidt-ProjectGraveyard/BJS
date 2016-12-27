import './index.html';

let _deps = new Tracker.Dependency;

Meteor.accounts = {
    logged_in: [
        ["Gruppenleiter", "Q2b"]
    ],
    logged_out: [
        "Station"
    ]
};

Meteor.accounts = {
    "Gruppenleiter": {
        account: undefined,
        placeholder: ["Q2b"],
        logged_in: true
    },
    "Station": {
        account: undefined,
        placeholder: ["Weitsprung"],
        logged_in: false
    }
};

Template.registerHelper('arrayify', function (obj) {
    let result = [];
    for (const key in obj) {
        const new_obj = obj[key];
        new_obj.name = key;
        result.push(new_obj);
    }
    console.log("HEY", result);
    return result;
});

Template.login.helpers({
    "accounts": function () {
        _deps.depend();
        return Meteor.accounts;
    },
    "login": function () {
        _deps.depend();
        return Meteor.accounts.logged_out;
    },
    "logout": function () {
        _deps.depend();
        return Meteor.accounts.logged_in;
    }
});

Template.login.events({
    'click .input-ui-button': function (event) {
        event.preventDefault();
        FlowRouter.go("/contest");
    },
    'click .login-button': function (event) {
        event.preventDefault();

        const name = event.target.dataset.name;
        Meteor.accounts[name].logged_in = true;

        _deps.changed();
    },
    'click .logout-button': function (event) {
        event.preventDefault();

        const name = event.target.dataset.name;
        Meteor.accounts[name].logged_in = false;

        _deps.changed();
    }
});