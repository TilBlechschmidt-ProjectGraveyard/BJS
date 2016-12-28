import {Template} from "meteor/templating";
import "./index.html";
import "./index.css";
import {AccountManagement} from "../../../api/AccountManagement/index";

export let input_onload = function () {
    Template.login.helpers({
        show_login: !AccountManagement.inputPermitted()
    });

    Template.input.onRendered(function () {
        Meteor.f7 = new Framework7({
            swipePanel: 'left'
        });
    });
};