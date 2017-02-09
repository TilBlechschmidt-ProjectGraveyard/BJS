
/**
 * Created by empty on 17-Nov-16.
 */
import {Template} from 'meteor/templating';
import './index.html';
import {twoView} from './../../two_view/index.js';
import {COMPETITION_TYPES} from '../../../../api/logic/competition_type';

export let myapp = new Framework7();

let comp_types = [];
for (let competition_type in COMPETITION_TYPES) {
    comp_types[competition_type]=COMPETITION_TYPES[competition_type].object.getInformation().name;
}

let mypicker = myapp.picker({
    input: '#pick-comp_type',
    cols: [{
        values: comp_types,
        textAlign: 'center'
    }],
    onChange: function(picker,values,displayValues) {
        document.getElementById('pick-comp_type').value = displayValues;
    }
});


Template.home_main.events({
    'click #pick-comp_type'(event, instance) {
        mypicker.open();
    },
});

Template.home_main.events({
    'click #link_next' (event, instance) {
        FlowRouter.go('/config/sports');
    },
});