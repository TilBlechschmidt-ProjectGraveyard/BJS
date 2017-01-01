import {Template} from "meteor/templating";
import "./index.html";
import {DBInterface} from "../../../../../api/database/db_access";

Template.home_main.onRendered(function () {
    DBInterface.waitForReady(function () {
        document.getElementById('current-contest-name').innerHTML = DBInterface.getCompetitionName();
        document.getElementById('current-contest-type').innerHTML = DBInterface.getCompetitionType().getInformation().name;
    });
});