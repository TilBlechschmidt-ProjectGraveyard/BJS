import {login_onLoad, getLoginSwiper, goToStep} from "./template";
import {tryDecrypt, selectDefaultAthlete} from "../../../startup/client/helpers";
import {InputAccountManager} from "../../../api/account_managment/InputAccountManager";
const login = FlowRouter.group({
    prefix: '/login'
});

const login_overview = {
    template: "login_overview", data: {
        choices: [
            {title: "Ich bin ein Gruppenleiter", type: "Gruppenleiter"},
            {title: "Ich bin eine Station", type: "Station"},
            {title: "Ich bin ein Administrator", type: "Administrator"}
        ]
    }
};

export let checkPermission = function () {
    console.log("permission check");

    const groupLoggedIn = InputAccountManager.getGroupAccount().logged_in;
    const stationLoggedIn = InputAccountManager.getStationAccount().logged_in;
    console.log(groupLoggedIn, stationLoggedIn);

    if (groupLoggedIn && !stationLoggedIn) {
        FlowRouter.go('/login/' + btoa("Gruppenleiter") + '/' + btoa("Station"));
        // if (getLoginSwiper()) goToStep(getLoginSwiper(), 2);
        return true;
    } else if (stationLoggedIn && !groupLoggedIn) {
        FlowRouter.go('/login/' + btoa("Station") + '/' + btoa("Gruppenleiter"));
        // if (getLoginSwiper()) goToStep(getLoginSwiper(), 2);
        return true;
    } else if (stationLoggedIn && groupLoggedIn)
        selectDefaultAthlete();

    return false;
};

login.route("/", {
    triggersEnter: login_onLoad,
    action: function () {

        checkPermission();

        BlazeLayout.render("login", {
            steps: [
                login_overview,
                {template: "preloader"},
                {template: "preloader"}
            ]
        });
    }
});

login.route("/:loginA", {
    triggersEnter: login_onLoad,
    action: function (params) {

        checkPermission();

        params.loginA = tryDecrypt(params.loginA);

        const steps = [
            login_overview,
            {template: "omni_login", data: {type: params.loginA}}
        ];

        if (params.loginA !== "Administrator") steps.push({template: "preloader"});

        BlazeLayout.render("login", {steps: steps});

        Template.login.onRendered(function () {
            goToStep(getLoginSwiper(), 1);
        });
    }
});

login.route("/:loginA/:loginB", {
    triggersEnter: login_onLoad,
    action: function (params) {

        checkPermission();

        params.loginA = tryDecrypt(params.loginA);
        params.loginB = tryDecrypt(params.loginB);

        BlazeLayout.render("login", {
            steps: [
                login_overview,
                {template: "omni_login", data: {type: params.loginA}},
                {template: "omni_login", data: {type: params.loginB}}
            ]
        });

        Template.login.onRendered(function () {
            goToStep(getLoginSwiper(), 2);
        });
    }
});