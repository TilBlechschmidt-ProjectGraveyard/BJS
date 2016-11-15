import {Meteor} from 'meteor/meteor';
import {onStartup} from '../imports/startup/server/index.js';

Meteor.startup(function () {
    onStartup();
});