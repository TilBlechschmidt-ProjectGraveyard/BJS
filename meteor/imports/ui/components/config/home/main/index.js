import {Template} from "meteor/templating";
import "./index.html";
import {DBInterface} from "../../../../../api/database/db_access";
import {AccountManager} from "../../../../../api/account_managment/AccountManager";


let ip_tracker = new Tracker.Dependency();
let ips = [];

Template.home_main.onRendered(function () {
    DBInterface.waitForReady(function () {
        document.getElementById('current-contest-name').innerHTML = DBInterface.getCompetitionName();
        document.getElementById('current-contest-type').innerHTML = DBInterface.getCompetitionType().getInformation().name;
        DBInterface.getServerIPs(function (data) {
            ips = data;
            ip_tracker.changed();
        });
    });
});

Template.home_main.helpers({
    get_server_ips: function () {
        ip_tracker.depend();
        return ips;
    }
});

Template.home_main.events({
    'click .logout-button': function (event) {
        event.target.blur();
        Meteor.f7.confirm("Möchten Sie sich wirklich abmelden?", "Abmelden", function () {
            AccountManager.logout("Administrator");
            sessionStorage.removeItem("firstLogin");
            FlowRouter.go('/login');
        });
        return false;
    },
});