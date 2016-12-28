import {onStartup} from "../imports/startup/client/index";

FlowRouter.triggers.enter(function () {
    Meteor.f7 = new Framework7({
        swipePanel: 'left'
    });
});

onStartup();