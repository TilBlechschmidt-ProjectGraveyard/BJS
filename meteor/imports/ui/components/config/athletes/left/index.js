import {Template} from 'meteor/templating';
import './index.html';

Template.athletes_left.events({
    'click #link_back' (event, instance) {
        FlowRouter.go('/config/sports');
    },
});