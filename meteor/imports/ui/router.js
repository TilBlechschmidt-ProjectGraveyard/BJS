import {AccountManager} from "../api/account_managment/AccountManager";
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
        AccountManager.logout('Gruppenleiter', true);
        AccountManager.logout('Station', true);
        AccountManager.logout('Administrator', true);
        AccountManager.logout('Urkunden Erstellen', true);
        FlowRouter.go('/login');
    }
});

const input = FlowRouter.group({
    prefix: '/contest'
});

input.route('/', {
    triggersEnter: input_onload,
    action: function () {
        if (!AccountManager.viewPermitted()) {
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