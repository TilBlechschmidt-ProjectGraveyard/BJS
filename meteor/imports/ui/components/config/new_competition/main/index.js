import {Template} from "meteor/templating";
import "./index.html";
import {COMPETITION_TYPES} from "../../../../../api/logic/competition_type";
import {NewCompetition} from "../../new_competition_helpers";


function save() {
    //TODO set new competition type id
    NewCompetition.setName(document.getElementById('text-comp_name').value);
}

Template.new_competition_main.onRendered(function () {
    //TODO set mypicker start value
    document.getElementById('text-comp_name').value = NewCompetition.getName();
});

Template.new_competition_main.events({
    'click #link_back' (event, instance) {
        Meteor.f7.confirm('Beim Abbrechen gehen alle Einstellungen verloren.', 'Abbrechen ohne speichern', function () {
            FlowRouter.go('/config');//TODO this is called multiple times after you left the new competition multiple times
        });
    },
    'click #link_next' (event, instance) {
        save();
        FlowRouter.go('/config/sports');
    }
});

export let new_competition_main_onLoad = function () {
    let comp_types = [];
    for (let competition_type in COMPETITION_TYPES) {
        comp_types[competition_type] = COMPETITION_TYPES[competition_type].object.getInformation().name;
    }

    let mypicker = Meteor.f7.picker({
        input: '#pick-comp_type',
        cols: [{
            values: comp_types,
            textAlign: 'center'
        }],
        onChange: function (picker, values, displayValues) {
            document.getElementById('pick-comp_type').value = [displayValues];
            NewCompetition.setCompetitionTypeID(picker.cols[0].activeIndex);
        }
    });

    Template.new_competition_main.events({
        'click #pick-comp_type'(event, instance) {
            mypicker.open();
        }
    });
};