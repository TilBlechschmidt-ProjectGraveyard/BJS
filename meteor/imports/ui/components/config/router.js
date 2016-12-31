import {athletes_right_onLoad} from "./athletes/right";

let config = FlowRouter.group({
    prefix: '/config'
});

config.route('/', {
    action: function () {
        BlazeLayout.render('two_view', {
            first: 'view_left',
            second: 'view_main',
            nested_left: 'home_left',
            nested_main: 'home_main',
        });
    }
});

config.route('/new', {
    action: function () {
        BlazeLayout.render('new_competition_main');
    }
});

config.route('/sports', {
    action: function () {
        BlazeLayout.render('sports_main');
    }
});

config.route('/athletes', {
    triggersEnter: athletes_right_onLoad,
    action: function () {
        BlazeLayout.render('two_view', {
            first: 'view_left',
            second: 'view_middle',
            third: 'view_right',
            nested_left: 'athletes_left',
            nested_middle: 'athletes_middle',
            nested_right: 'athletes_right',
        });
    }
});

config.route('/codes', {
    action: function () {
        BlazeLayout.render('two_view', {
            first: 'view_full',
            nested_full: 'codes',
        });
    }
});
