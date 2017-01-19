import {AccountManager} from "../../../imports/api/accountManagement/AccountManager";


function checkPermission() {
    if (!AccountManager.getAdminAccount().logged_in) {
        FlowRouter.go('/login');
        return false;
    }
    return true;
}

FlowRouter.route('/config', {
    action: function () {
        if (checkPermission()) BlazeLayout.render('config');
    }
});

FlowRouter.route('/codes', {
    action: function () {
        if (checkPermission()) BlazeLayout.render('accessCodes');
    }
});