import {Template} from "meteor/templating";
import "./index.html";
import {DBInterface} from "../../../../../api/database/db_access";

let _deps = new Tracker.Dependency();

let competitions = [];


Template.home_left.helpers({
    "competitions": function () {
        _deps.depend();
        return competitions;
    }
});

Template.home_left.events({
    'click .link-activate_competition': function (event) {
        const name = event.target.dataset.competition_name;
        Meteor.f7.confirm('Um den Wettbewerb "' + name + '" zu starten wird der gesamte Server neu gestartet. Wollen Sie fortfahren?', 'Wettbewerb starten', function () {
            DBInterface.activateCompetition(name);
        });
    },
    'click #link-new_competition': function (event) {
        Session.keys = {}; //clear any configuration
        FlowRouter.go('/config/new');
    }
});


export let home_left_onLoad = function () {
    DBInterface.waitForReady(function () {
        competitions = DBInterface.listCompetition();
        _deps.changed();
    });
};