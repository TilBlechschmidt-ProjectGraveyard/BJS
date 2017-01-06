import "./offline.html";
import {AccountManager} from "../../../imports/api/account_managment/AccountManager";
import {updateSwiperProgress} from "../login/router";

Template.offline.events({
    'click #goToLoginButton': function () {
        AccountManager.logoutAll();
        FlowRouter.go('/login');
        updateSwiperProgress(0);
    }
});