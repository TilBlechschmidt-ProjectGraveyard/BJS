import {InputAccountManager} from "../api/account_managment/InputAccountManager";
import {input_onload} from "./components/input/index";

FlowRouter.route('/', {
    action: function () {
        // FlowRouter.go("/config");
        //TODO: Check if it is already configured and run the following if that is the case:
        FlowRouter.go("/login");
    }
});

FlowRouter.route('/logout', {
    action: function () {
        InputAccountManager.logout('Gruppenleiter', true);
        InputAccountManager.logout('Station', true);
        // InputAccountManager.logout('Administrator', true);
        FlowRouter.go('/login');
    }
});

const input = FlowRouter.group({
    prefix: '/contest'
});

input.route('/', {
    triggersEnter: input_onload,
    action: function () {
        if (!InputAccountManager.viewPermitted()) {
            FlowRouter.go('/login');
            return;
        }
        BlazeLayout.render('input');
    }
});

input.route('/:athlete_id', {
    triggersEnter: input_onload,
    action: function (params) {
        BlazeLayout.render('input', {
            athlete_id: params.athlete_id
        });
    }
});