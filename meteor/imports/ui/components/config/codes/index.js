import {Template} from "meteor/templating";
import "./index.html";
import "../../../layouts/views.css";

Template.codes.events({
    'click #link_back' (event,instance) {
        FlowRouter.go('/config/athletes');
    },
    'click #link_save' (event, instance) {
        Meteor.f7.confirm('Nach dem Speichern könne keine Änderungen mehr vorgenommen werden. Der neue Wettkampf wird automatisch aktiviert.', 'Entgültig speichern', function () {
            // TODO implement create new competition
            FlowRouter.go('/config');
        });
    }
});