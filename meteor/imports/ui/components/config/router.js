import "./athletes/right";
import {AccountManager} from "../../../api/account_managment/AccountManager";

let config = FlowRouter.group({
    prefix: '/config',
    name: 'config'
});

function checkPermission() {
    if (!AccountManager.getAdminAccount().logged_in) {
        FlowRouter.go('/login');
        return false;
    }
    return true;
}

function inEditMode() {
    if (!Meteor.oldName) {
        FlowRouter.go('/config');
        return false;
    }
    return true;
}

config.route('/', {
    action: function () {
        if (checkPermission()) {
            BlazeLayout.render('two_view', {
                first: 'view_left',
                second: 'view_main',
                nested_left: 'home_left',
                nested_main: 'home_main',
            });
        }
    }
});

config.route('/new', {
    action: function () {
        if (checkPermission() && inEditMode()) BlazeLayout.render('new_competition_main');
    }
});

config.route('/sports', {
    action: function () {
        if (checkPermission() && inEditMode()) BlazeLayout.render('sports_main');
    }
});

config.route('/athletes', {
    action: function () {
        if (checkPermission() && inEditMode()) {
            BlazeLayout.render('two_view', {
                first: 'view_left',
                second: 'view_middle',
                third: 'view_right',
                nested_left: 'athletes_left',
                nested_middle: 'athletes_middle',
                nested_right: 'athletes_right',
            });
        }
    }
});

config.route('/codes', {
    action: function () {
        if (checkPermission() && inEditMode()) {
            BlazeLayout.render('two_view', {
                first: 'view_full',
                nested_full: 'codes',
            });
        }
    }
});