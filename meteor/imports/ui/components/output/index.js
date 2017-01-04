import {Template} from "meteor/templating";
import "./index.html";
import {DBInterface} from "../../../api/database/db_access";
import {getAccountByPassphrase, AccountManager} from "../../../api/account_managment/AccountManager";
import {updateSwiperProgress} from "../login/router";


let groups = [];
let current_group = -1;
const groups_deps = new Tracker.Dependency();


function refresh() {
    DBInterface.generateCertificates(AccountManager.getOutputAccount().account, function (data) {
        groups = data;
        current_group = 0;
        groups_deps.changed();
    });
}

Template.output.onRendered(function () {
    DBInterface.waitForReady(function () {
        refresh();
    });
});

//noinspection JSUnusedGlobalSymbols
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
    'click #btn_refresh': refresh,
    'click .logout-button': function (event) {
        Meteor.f7.confirm("Möchten Sie sich wirklich abmelden?", "Abmelden", function () {
            AccountManager.logout("Urkunden");
            sessionStorage.removeItem("firstLogin");
            FlowRouter.go('/login');
            updateSwiperProgress(0);
            return false;
        });
    },
});