import {AccountManager} from "../../../imports/api/account_managment/AccountManager";

FlowRouter.route('/input', {
    action: function () {
        if (AccountManager.viewPermitted()) BlazeLayout.render('input');
        else FlowRouter.go('/login');
    }
});