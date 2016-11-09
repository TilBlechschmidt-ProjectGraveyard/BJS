import {Meteor} from "meteor/meteor";

Meteor.startup(function () {
    import {onStartup} from '../imports/startup/server/index.js';
    onStartup();
});