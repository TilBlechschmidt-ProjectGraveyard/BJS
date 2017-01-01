import "../../ui/router";
import "../../ui/components/views";
import "../../ui/components/config";
import "../../ui/components/input";
import "../../ui/components/single_login";
import "../../ui/components/output";
import {arrayify} from "./helpers";

// Run things on startup
export function onStartup() {
    Template.registerHelper('arrayify', arrayify);

    FlowRouter.triggers.enter(function () {
        Meteor.f7 = new Framework7({
            swipePanel: 'left'
        });
    });
    // console.log('Hi there from the client startup script!');
}
