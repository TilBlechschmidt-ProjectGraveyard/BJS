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

FlowRouter.route('/contest', {
    action: function () {
        if (AccountManager.viewPermitted()) BlazeLayout.render('input');
        else FlowRouter.go('/login');
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
