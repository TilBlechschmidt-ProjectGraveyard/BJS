import {AccountManager} from "../imports/api/account_managment/AccountManager";

FlowRouter.triggers.enter(function () {
    Meteor.f7 = new Framework7({
        swipePanel: 'left'
    });
});

FlowRouter.notFound = {
    action: function () {
        console.error("404 - Page not found! (" + FlowRouter.current().path + ")");
        FlowRouter.go('/login');
    }
};

FlowRouter.route('/logout', {
    action: function () {
        AccountManager.logoutAll();
        Meteor.inputDependency.changed();
        FlowRouter.go('/login');
    }
});

import {streamer} from "../imports/api/streamer";
streamer.on('message', function(message) {
    console.log('user: ' + message);
});