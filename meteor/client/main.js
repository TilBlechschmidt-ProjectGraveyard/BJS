import {onStartup} from "../imports/startup/client/index";

onStartup();

FlowRouter.route('/', {
    action: function() {
        BlazeLayout.render('two_view', {
            first: 'view_left',
            second: 'view_main',
            nested_left: 'home_left',
            nested_main: 'home_main',
        });
    }
});

let config = FlowRouter.group({
   prefix: '/config'
});

