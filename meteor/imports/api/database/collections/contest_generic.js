import {Collection} from "./collection";

export let Contest = new Collection('Contest', true);

Contest.createMockData = function () {
    this.handle.insert({
        contestType: 0
    });
};