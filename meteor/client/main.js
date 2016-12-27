import {onStartup} from "../imports/startup/client/index";

onStartup();

FlowRouter.route('/', {
    action: function() {
        FlowRouter.go("/config");
        //TODO: Check if it is already configured and run the following if that is the case:
        //FlowRouter.go("/contest");
    }
});

let input = FlowRouter.group({
    prefix: '/contest'
});

input.route('/', {
    action: function () {
        BlazeLayout.render('table_main');
    }
});

input.route('/login', {
    action: function () {
        BlazeLayout.render('login', {
            login_fields: [
                "Gruppenleiter",
                "Station"
            ]
        });
    }
});

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

config.route('/sports', {
    action: function () {
        BlazeLayout.render('two_view', {
            first: 'view_left',
            second: 'view_main',
            nested_left: 'sports_left',
            nested_main: 'sports_main',
        });
    }
});

config.route('/athletes', {
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
