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
        sessionStorage.removeItem("firstLogin");
        Meteor.inputDependency.changed();
        FlowRouter.go('/login');
    }
});

const input = FlowRouter.group({
    prefix: '/contest'
});

function checkPermission() {
    if (!AccountManager.viewPermitted()) {
        FlowRouter.go('/login');
        return false;
    }
    return true;
}

input.route('/', {
    triggersEnter: input_onload,
    action: function () {
        if (checkPermission()) BlazeLayout.render('input');
    }
});

input.route('/:athlete_id', {
    triggersEnter: input_onload,
    action: function (params) {
        if (checkPermission()) {
            BlazeLayout.render('input', {
                athlete_id: params.athlete_id
            });
        }
    }
});