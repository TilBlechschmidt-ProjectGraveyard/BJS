import {Collection} from './collection';

export let Athletes = new Collection('Athletes', true);

Athletes.createMockData = function () {
    this.handle.insert({
        name: "Someone"
    });
};