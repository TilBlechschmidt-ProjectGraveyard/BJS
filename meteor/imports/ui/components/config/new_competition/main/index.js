import {Template} from "meteor/templating";
import "./index.html";
import {COMPETITION_TYPES} from "../../../../../api/logic/competition_type";
import {NewCompetition} from "../../new_competition_helpers";


function save() {
    console.log(document.getElementById("pick-comp_type").selectedIndex);
    NewCompetition.setCompetitionTypeID(document.getElementById("pick-comp_type").selectedIndex);
    NewCompetition.setName(document.getElementById('text-comp_name').value);
}

Template.new_competition_main.onRendered(function () {
    let selector = document.getElementById("pick-comp_type");
    selector.innerHTML = "";

    for (let competition_type in COMPETITION_TYPES) {
        selector.innerHTML += "<option>" + COMPETITION_TYPES[competition_type].object.getInformation().name + "</option>";
    }

    document.getElementById("pick-comp_type").selectedIndex = NewCompetition.getCompetitionTypeID();
    document.getElementById('text-comp_name').value = NewCompetition.getName();
    document.getElementById('text-comp_name').value = NewCompetition.getName();
});

Template.new_competition_main.events({
    'click #link_back' (event, instance) {
        Meteor.f7.confirm('Beim Abbrechen gehen alle Einstellungen verloren.', 'Abbrechen ohne speichern', function () {
            FlowRouter.go('/config');
        });
    },
    'click #link_next' (event, instance) {
        save();
        FlowRouter.go('/config/sports');
    }
});