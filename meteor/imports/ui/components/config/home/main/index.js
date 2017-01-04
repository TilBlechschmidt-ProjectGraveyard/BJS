import {Template} from "meteor/templating";
import "./index.html";
import {DBInterface} from "../../../../../api/database/db_access";
import {AccountManager} from "../../../../../api/account_managment/AccountManager";
import {updateSwiperProgress} from "../../../login/router";

Template.home_main.onRendered(function () {
    DBInterface.waitForReady(function () {
        document.getElementById('current-contest-name').innerHTML = DBInterface.getCompetitionName();
        document.getElementById('current-contest-type').innerHTML = DBInterface.getCompetitionType().getInformation().name;
    });
});

Template.home_main.events({
    'click .logout-button': function (event) {
        Meteor.f7.confirm("Möchten Sie sich wirklich abmelden?", "Abmelden", function () {
            AccountManager.logout("Administrator");
            sessionStorage.removeItem("firstLogin");
            FlowRouter.go('/login');
            updateSwiperProgress(0);
            return false;
        });
    },
});