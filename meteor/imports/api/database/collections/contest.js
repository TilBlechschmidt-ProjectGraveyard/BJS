import {Collection} from "./collection";

export let Contest = new Collection('Contest', true);

Contest.createMockData = function () {
    this.handle.insert({
        contestType: 0,
        sportTypes: ['st_long_jump', 'st_ball_200', 'st_ball_200', 'st_endurance_1000', 'st_endurance_3000', 'st_sprint_100']
    });
};