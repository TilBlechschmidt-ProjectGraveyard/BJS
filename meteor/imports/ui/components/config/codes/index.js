import {Template} from 'meteor/templating';
import './index.html';
import '../../../layouts/views.css';

Template.codes.events({
    'click #link_back' (event,instance) {
        FlowRouter.go('/config/athletes');
    },
});

Template.codes.events({
    'click #button_menu' (event,instance) {
        FlowRouter.go('/');
    },
});

Template.codes.events({
    'click #button_print' (event,instance) {
        window.print();
    },
});