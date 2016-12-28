import {Template} from 'meteor/templating';
import './index.html';
import '../../../../../data/start_classes.json';

export let athletes_right_onLoad = function () {
    let st_classes = [];
    let start_classes = require('../../../../../data/start_classes.json');
    let counter = 0;
    for (let st_class in start_classes) {
        st_classes[counter] = start_classes[st_class].name;
        counter++;
    }

    let mypicker = Meteor.f7.picker({
        input: '#pick-start_class',
        cols: [{
            values: st_classes,
            textAlign: 'center',
            width: '500px'
        }],
        onChange: function (picker, values, displayValues) {
            document.getElementById('pick-start_class').value = displayValues;
        }
    });

    Template.athletes_right.events({
        'click #pick-start_class'(event, instance) {
            // increment the counter when button is clicked
            mypicker.open();
        },
        'click #link_next'(event, instance) {
            FlowRouter.go('/config/codes');
        }
    });
};