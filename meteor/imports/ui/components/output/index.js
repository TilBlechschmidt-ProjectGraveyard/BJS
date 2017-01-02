import {Template} from "meteor/templating";
import "./index.html";
import {DBInterface} from "../../../api/database/db_access";
import {getAccountByPassphrase} from "../../../api/account_managment/AccountManager";

//TODO replace with login view
getAccountByPassphrase('urkunden', function (account) {
    if (account) {
        Meteor.certificateAccount = account;
    } else {
        alert("Wrong urkunden password");
    }
});

let groups = [];
let current_group = -1;
const groups_deps = new Tracker.Dependency();


Template.output.onRendered(function () {
    DBInterface.generateCertificates(Meteor.certificateAccount, function (data) {
        groups = data;
        current_group = 0;
        groups_deps.changed();
    });
});

Template.output.helpers({
    list_groups: function () {
        groups_deps.depend();

        return _.map(groups, function (group) {
            return group.name;
        });
    },
    list_athletes: function () {
        groups_deps.depend();
        if (current_group == -1) return [];
        const ct = DBInterface.getCompetitionType();

        console.log(groups[current_group].athletes);
        return groups[current_group].athletes;
    },
    get_groupname: function () {
        groups_deps.depend();
        if (current_group == -1) return "Daten laden...";
        return groups[current_group].name;
    },
});
Template.output.events({
    'click .group-selector': function (event) {
        current_group = event.target.closest("li").dataset.id;
        Meteor.f7.closePanel();
        groups_deps.changed();
    },
});