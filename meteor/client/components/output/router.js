import {AccountManager} from "../../../imports/api/accountManagement/AccountManager";
const output = FlowRouter.group({
    prefix: '/output'
});

function checkPermission() {
    if (!AccountManager.getOutputAccount().logged_in) {
        FlowRouter.go('/login');
        return false;
    }
    return true;
}

output.route('/', {
    action: function () {
        if (checkPermission()) BlazeLayout.render('output');
    }
});
