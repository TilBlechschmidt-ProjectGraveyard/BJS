import {Template} from "meteor/templating";
import "./index.html";
import {COMPETITION_TYPES} from "../../../../../api/logic/competition_type";
import {DBInterface} from "../../../../../api/database/db_access";


export let home_main_onLoad = function () {
    let comp_types = [];
    for (let competition_type in COMPETITION_TYPES) {
        comp_types[competition_type] = COMPETITION_TYPES[competition_type].object.getInformation().name;
    }


    DBInterface.waitForReady(function () {

        Template.home_main.onRendered(function () {
            document.getElementById('current-contest-name').innerHTML = DBInterface.getCompetitionName();
            document.getElementById('current-contest-type').innerHTML = DBInterface.getCompetitionType().getInformation().name;
        }, 2000);
    });
};