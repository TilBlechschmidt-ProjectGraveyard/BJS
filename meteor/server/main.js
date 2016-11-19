import {Meteor} from "meteor/meteor";
import {onStartup} from "../imports/startup/server/index.js";
import {genRandomCode} from "../imports/api/crypto/pwdgen";

Meteor.startup(function () {
    onStartup();

    for (let i = 0; i < 1100; i++) {
        console.log(genRandomCode());
    }
});