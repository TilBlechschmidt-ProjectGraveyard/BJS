import "../../ui/components/two_view";
import "../../ui/components/config/home/left";
import "../../ui/components/config/home/main";
import "../../ui/components/config/new_competition/main";
import "../../ui/components/views/main";
import "../../ui/components/views/left";
import "../../ui/components/config/sports/main";
import "../../ui/components/views/middle";
import "../../ui/components/views/right";
import "../../ui/components/views/full";
import "../../ui/components/config/athletes/left";
import "../../ui/components/config/athletes/middle";
import "../../ui/components/config/athletes/right";
import "../../ui/components/config/codes";
import "../../ui/components/input";
import "../../ui/components/input/login";
import "../../ui/router";
import "../../ui/components/config/router";
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
