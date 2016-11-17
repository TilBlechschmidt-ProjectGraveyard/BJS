
/**
 * Created by empty on 17-Nov-16.
 */
import {Template} from 'meteor/templating';
import './index.html';
import {twoView} from './../../two_view/index.js';

export let myapp = new Framework7();

let mypicker = myapp.picker({
    input: '#pick-comp_type',
    cols: [{
        values: ['Leichtathletik','Schwimmen','Turnen'],
        textAlign: 'center'
    }],
    onChange: function(picker,values,displayValues) {
        document.getElementById('pick-comp_type').value = displayValues;
    }
});


Template.home_main.events({
    'click #pick-comp_type'(event, instance) {
        // increment the counter when button is clicked
        mypicker.open();
    },
});