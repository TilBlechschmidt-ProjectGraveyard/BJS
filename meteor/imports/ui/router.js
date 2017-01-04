import {AccountManager} from "../api/account_managment/AccountManager";
import "./components/input";

FlowRouter.route('/', {
    triggersEnter: [function () {
        FlowRouter.go("/login");
    }]
});

FlowRouter.route('/logout', {
    action: function () {
        AccountManager.logoutAll();
        Meteor.inputDependency.changed();
        FlowRouter.go('/login');
    }
});

FlowRouter.route('/input', {
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
