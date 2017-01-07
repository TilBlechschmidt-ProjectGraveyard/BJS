import {DBInterface} from "../../../imports/api/database/DBInterface";

const dbReady = new Tracker.Dependency();

Template.config.helpers({
    competitions: function () {
        dbReady.depend();
        if (!DBInterface.isReady()) return [];
        return Meteor.COLLECTIONS.Contests.handle.find().fetch();
    }
});

Template.config.onRendered(function () {
    DBInterface.waitForReady(function () {
        dbReady.changed();
    });
});