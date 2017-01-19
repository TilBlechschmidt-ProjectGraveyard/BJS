import {initCollections} from "../imports/api/database/collections/index";
import {Server} from "../imports/api/database/ServerInterface";
import {prepareAsyncHandler, registerSyncHandler} from "./meteorCalls";

function printAdminPwd() {
    console.log('Your utmost secure and highly trustworthy administrator password reads "'.italic.lightCyan + Meteor.COLLECTIONS.Generic.handle.findOne({_id: Server.db.getGenericID()}).adminPassword.bold.lightRed.underline + '".'.italic.lightCyan);
    console.log("Remember that with great power comes great responsibility, so you shall use it wisely!".italic.lightCyan);
    console.log("Now go, use all that voodoo power that comes with it and do some good to your people.".italic.lightCyan);
}

Meteor.startup(function () {
    // Load the config.json into the (semi-global) Meteor.config object
    Meteor.config = require('../config.json');
    if (Meteor.config.contestMongoURL === "EQUAL") Meteor.config.contestMongoURL = process.env.MONGO_URL.replace(/([^\/]*)$/, "");

    initCollections();
    printAdminPwd();

    prepareAsyncHandler();
    registerSyncHandler();
});