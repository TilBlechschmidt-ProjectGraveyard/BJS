import {Collection} from "./collection";

export let ContestGeneric = new Collection('ContestGeneric', true);

ContestGeneric.createMockData = function () {
    this.handle.insert({
        contestType: 0
    });
};