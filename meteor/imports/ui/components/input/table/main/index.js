import {Template} from "meteor/templating";
import "./index.html";
import "./index.css";

Template.table_main.events({
    'click .logout-button' () {
        FlowRouter.go('/contest/login');
    }
});