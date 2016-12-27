import {Template} from 'meteor/templating';
import './index.html';

Template.sports_main.events({
    'click #link_next' (event, instance) {
        FlowRouter.go('/config/athletes');
    },
});