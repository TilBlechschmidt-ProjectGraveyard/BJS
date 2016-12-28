import {Template} from "meteor/templating";
import "./index.html";
import "./index.css";
import {AccountManagement} from "../../../../../api/AccountManagement/index";

export let input_onload = function () {
    Template.login.helpers({
        show_login: !AccountManagement.inputPermitted()
    });
};