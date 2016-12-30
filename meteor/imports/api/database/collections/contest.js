import {ContestCollection} from "./collection";

export function initContest() {
    Meteor.COLLECTIONS.Contest = new ContestCollection('Contest');

    Meteor.COLLECTIONS.Contest.createMockData = function () {
        this.handle.insert({
            contestType: 0,
            sportTypes: ['st_long_jump', 'st_ball_200', 'st_endurance_1000', 'st_endurance_3000', 'st_sprint_100']
        });
    };
}