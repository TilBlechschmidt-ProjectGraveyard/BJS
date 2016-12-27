import {Template} from 'meteor/templating';
import './index.html';
import './index.css';

Template.sports_main.events({
    'click #link_next' () {
        FlowRouter.go('/config/athletes');
    },
});