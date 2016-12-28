import './index.html';

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
        return Meteor.accounts;
    }
});

Template.login.events({
    'click .input-ui-button': function (event) {
        event.preventDefault();
        // FlowRouter.go("/contest");
    },
    'click .login-button': function (event) {
        event.preventDefault();

        const name = event.target.dataset.name;
        Meteor.accounts[name].logged_in = true;

        _deps.changed();
        // lodash.remove(Meteor.accounts.logged_out, function (account) {
        //     return account == name;
        // });
        // Meteor.accounts.logged_in.push([name, "SOMETHING"]);
        // console.log(event.target.dataset.name);
        // console.log("Login!");
    },
    'click .logout-button': function (event) {
        event.preventDefault();

        const name = event.target.dataset.name;
        Meteor.accounts[name].logged_in = false;

        _deps.changed();
        // const name = event.target.dataset.name;
        // lodash.remove(Meteor.accounts.logged_in, function (account) {
        //     return account[0] == name;
        // });
        // Meteor.accounts.logged_out.push(name);
        // _deps.changed();
        // console.log(event.target.dataset.name);
        // console.log("Login!");
    }
});