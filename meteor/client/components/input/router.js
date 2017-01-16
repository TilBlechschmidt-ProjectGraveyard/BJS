import {AccountManager} from "../../../imports/api/accountManagement/AccountManager";

FlowRouter.route('/input', {
    action: function () {
        if (AccountManager.viewPermitted()) BlazeLayout.render('input');
        else FlowRouter.go('/login');
    }
});