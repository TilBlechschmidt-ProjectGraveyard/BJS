import {Template} from "meteor/templating";
import "./index.html";
import {NewCompetition} from "../../new_competition_helpers";

Template.sports_main.helpers({
    "sport_type_data": function () {
        const ct = NewCompetition.getCompetitionType();
        return _.map(NewCompetition.getSports(), function (sportTypeObj) {
            return {
                name: ct.getNameOfSportType(sportTypeObj.stID),
                stID: sportTypeObj.stID,
                checked: sportTypeObj.activated ? "checked" : ""
            };
        });
    }
});

function save() {
    NewCompetition.setSports(
        _.map(NewCompetition.getSports(), function (sportTypeObj) {
            return {
                stID: sportTypeObj.stID,
                activated: document.getElementById('check_' + sportTypeObj.stID).checked,
            };
        })
    );
}

Template.sports_main.events({
    'click #link_back' (event, instance) {
        save();
        FlowRouter.go('/config/new');
    },
    'click #link_next' (event, instance) {
        save();
        FlowRouter.go('/config/athletes');
    },
});