import "./index.html";
import {AccountManager} from "../../../api/account_managment/AccountManager";
import {updateSwiperProgress} from "../login/router";

Template.offline.helpers({
    isOffline: function () {
        // return true;
        const time = new Date().getTime();
        const connected = Meteor.status().connected;
        if (Meteor.pageVisitTime + 3000 < time) {
            const groupName = FlowRouter.current().route.group.name;
            return !connected && (groupName == "config" || groupName == "output");
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