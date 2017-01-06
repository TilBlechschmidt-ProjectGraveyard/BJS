import "../../ui/router";
import "../../ui/components/icons";
import "../../ui/components/login";
import "../../ui/components/views";
import "../../ui/components/config";
import "../../ui/components/input";
import "../../ui/components/output";
import "../../ui/components/offline/index";
import "../../ui/components/preloader";
import {arrayify, triggerDefaultModalAction, isOffline} from "./helpers";

// Run things on startup
export function onStartup() {

    Meteor.pageVisitTime = new Date().getTime();

    Template.registerHelper('arrayify', arrayify);
    Template.registerHelper('not', function (b) {
        return !b;
    });
    Template.registerHelper('isEmpty', function (arr) {
        if (arr === undefined) return true;
        return arr.length === 0;
    });
    Template.registerHelper('isNotEmpty', function (arr) {
        if (arr === undefined) return true;
        return arr.length !== 0;
    });
    Template.registerHelper('length', function (arr) {
        return arr.length;
    });
    Template.registerHelper('inc', function (i) {
        return ++i;
    });
    Template.registerHelper('hasData', function (obj) {
        return Object.keys(obj).length > 0;
    });
    Template.registerHelper('isOffline', isOffline);

    Template.body.events({
        'keypress': function (event) {
            if (event.keyCode == 13)
                triggerDefaultModalAction();
        },
        'click': function (event) {
            if (event.target.tagName !== "INPUT")
                event.target.blur();
        }
    });

    FlowRouter.triggers.enter(function () {
        Meteor.f7 = new Framework7({
            swipePanel: 'left'
        });
    });
}
