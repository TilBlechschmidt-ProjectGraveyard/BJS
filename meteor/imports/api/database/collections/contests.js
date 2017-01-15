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
            sportTypes: [   "st_sprint_50", "st_sprint_75", "st_sprint_100_el",
                            "st_endurance_800", "st_endurance_1000","st_endurance_2000","st_endurance_3000",
                            "st_long_jump", "st_high_jump",
                            "st_rounders", "st_shot_put_3", "st_put_4", "st_put_5", "st_put_6", "st_put_7.26",
                            "st_ball_200", "st_ball_with_throwing_strap_1",
                        ],
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
            readOnly: false,
            customAccounts: []
        });
        this.handle.insert({
            name: "Bundesjugendspiele 2015",
            type: 0,
            sportTypes: ["st_long_jump", "st_ball_200", "st_endurance_3000", "st_sprint_100"],
            readOnly: false,
            customAccounts: []
        });
    };
}