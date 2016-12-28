import {Template} from "meteor/templating";
import "./index.html";
import "./index.css";
import {AccountManagement} from "../../../api/AccountManagement/index";
import {Log} from "../../../api/log";
import {COMPETITION_TYPES} from "../../../api/logic/competition_type";
import {Athlete} from "../../../api/logic/athlete";

export let input_onload = function () {
    Template.login.helpers({
        show_login: !AccountManagement.inputPermitted()
    });

    Template.input.helpers({
        athletes: function () {
            const log = new Log();
            const ct = COMPETITION_TYPES[0].object;
            const athletes = [
                new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct),
                new Athlete(log, 'Klaus', 'Karlsen', 2000, true, 'Q#z', '0', ct.maxAge, ct)
            ];

            let athlete_list = [];
            for (let athlete in athletes) {
                if (!athletes.hasOwnProperty(athlete)) continue;
                athlete = athletes[athlete];
                athlete_list.push({id: athlete.id, name: athlete.getFullName()});
            }

            console.log("TEST", athlete_list);

            return athlete_list;
        },
    });

    Template.input.events({
        'click li.athlete': function () {
            console.log("HEY THERE");
        }
    });

    Template.input.onRendered(function () {
        Meteor.f7 = new Framework7({
            swipePanel: 'left'
        });
    });
};