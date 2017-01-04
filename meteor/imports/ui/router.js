import {AccountManager} from "../api/account_managment/AccountManager";
import "./components/input";

FlowRouter.route('/', {
    action: function () {
        // FlowRouter.go("/config");
        //TODO: Check if it is already configured and run the following if that is the case:
        FlowRouter.go("/login");
    }
});

FlowRouter.route('/logout', {
    action: function () {
        AccountManager.logoutAll();
        Meteor.inputDependency.changed();
        FlowRouter.go('/login');
    }
});

const input = FlowRouter.group({
    prefix: '/contest'
});

function checkPermission() {
    if (!AccountManager.viewPermitted()) {
        FlowRouter.go('/login');
        return false;
    }
    return true;
}

input.route('/', {
    action: function () {
        if (checkPermission()) BlazeLayout.render('input');
    }
});

input.route('/:athlete_id', {
    action: function (params) {
        if (checkPermission()) {
            BlazeLayout.render('input', {
                athlete_id: params.athlete_id
            });
        }
    }
});

const output = FlowRouter.group({
    prefix: '/output'
});

output.route('/', {
    action: function () {
        BlazeLayout.render('output');
    }
});
