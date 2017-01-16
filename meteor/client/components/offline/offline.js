import "./offline.html";
import {AccountManager} from "../../../imports/api/accountManagement/AccountManager";
import {updateSwiperProgress} from "../login/router";

Template.offline.events({
    'click #goToLoginButton': function (event) {
        AccountManager.logoutAll();
        FlowRouter.go('/login');
        updateSwiperProgress(0);
    }
});