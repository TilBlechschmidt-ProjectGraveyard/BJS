import {AccountManager} from "../imports/api/accountManagement/AccountManager";
import {refreshAthletes} from "./components/input/input";

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
        refreshAthletes();
        FlowRouter.go('/login');
    }
});