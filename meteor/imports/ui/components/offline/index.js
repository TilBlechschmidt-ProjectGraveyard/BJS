import "./index.html";
import {AccountManager} from "../../../api/account_managment/AccountManager";
import {updateSwiperProgress} from "../login/router";

Template.offline.helpers({
    isOffline: function () {
        const time = new Date().getTime();
        const connected = Meteor.status().connected;
        console.log("check");
        if (Meteor.pageVisitTime + 1000 < time) {
            return !connected;
        } else {
            return false;
        }
    }
});

Template.offline.events({
    'click #goToLoginButton': function () {
        AccountManager.logoutAll();
        FlowRouter.go('/login');
        updateSwiperProgress(0);
    }
});