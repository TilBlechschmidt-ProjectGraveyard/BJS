import {Collection} from "./collection";

export function initContests() {
    Meteor.COLLECTIONS.Contests = new Collection('Contests', function (name, handle) {
        // deny all writing access
        handle.deny({
            insert() {
                return true;
            },
            update() {
                return true;
            },
            remove() {
                return true;
            },
        });

        Meteor.publish(name, function () {
            return handle.find({}, {
                fields: {
                    'customAccounts': false
                }
            });
        });
    });

    Meteor.COLLECTIONS.Contests.createMockData = function () {
        this.handle.insert({
            _id: "s0meVeryRand0mAndWe1rdDatabase1D",
            name: "Beispiel | BJS " + new Date().getFullYear(),
            type: 0,
            sportTypes: ["st_long_jump", "st_ball_200", "st_endurance_1000", "st_endurance_3000", "st_sprint_100"],
            readOnly: true
        });
        this.handle.insert({
            name: "Bundesjugendspiele " + new Date().getFullYear(),
            type: 0,
            sportTypes: ["st_long_jump", "st_endurance_3000", "st_sprint_100"],
            readOnly: true
        });
        this.handle.insert({
            name: "Bundesjugendspiele 2016",
            type: 0,
            sportTypes: ["st_long_jump", "st_ball_200", "st_endurance_1000", "st_sprint_100"],
            readOnly: false
        });
        this.handle.insert({
            name: "Bundesjugendspiele 2015",
            type: 0,
            sportTypes: ["st_long_jump", "st_ball_200", "st_endurance_3000", "st_sprint_100"],
            readOnly: false
        });
    };
}