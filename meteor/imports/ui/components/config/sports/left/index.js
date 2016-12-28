import {Template} from 'meteor/templating';
import './index.html';

Template.sports_left.events({
    'click #link_back' (event, instance) {
        FlowRouter.go('/config');
    },
});