import {getLoginSwiper, goToStep} from "./template";
import {tryDecrypt, invertLogin} from "../../../startup/client/helpers";
import {AccountManager} from "../../../api/account_managment/AccountManager";

const login = FlowRouter.group({
    prefix: '/login'
});

const login_overview = {
    template: "choices", data: {
        class: "overview-choice",
        choices: [
            {title: "Anmeldung durch Gruppenleiter", type: "Gruppenleiter"},
            {title: "Anmeldung durch Stationsleiter", type: "Station"},
            {title: "Zugriff auf Urkunden", type: "Urkunden"},
            {title: "Administratorzugriff", type: "Administrator"}
        ]
    }
};

export let updateSwiperProgress = function (slideIndex) {
    let swiper = getLoginSwiper();
    if (swiper) {
        if (slideIndex === undefined) slideIndex = 2;
        swiper.update(true);
        goToStep(swiper, slideIndex);
    }
};

export let checkPermission = function () {
    const groupLoggedIn = AccountManager.getGroupAccount().logged_in;
    const stationLoggedIn = AccountManager.getStationAccount().logged_in;
    const adminLoggedIn = AccountManager.getAdminAccount().logged_in;
    const outputLoggedIn = AccountManager.getOutputAccount().logged_in;
    const loginA = tryDecrypt(FlowRouter.getParam("loginA"));
    const loginB = tryDecrypt(FlowRouter.getParam("loginB"));

    if (loginA && loginB && !(groupLoggedIn || stationLoggedIn)) {
        FlowRouter.go('/login');
        updateSwiperProgress(0);
        return {redirected: true};
    } else if (groupLoggedIn && !stationLoggedIn && !(loginA == "Gruppenleiter" && loginB == "Station")) {
        FlowRouter.go('/login/' + btoa("Gruppenleiter") + '/' + btoa("Station"));
        return {redirected: true};
    } else if (stationLoggedIn && !groupLoggedIn && !(loginA == "Station" && loginB == "Gruppenleiter")) {
        FlowRouter.go('/login/' + btoa("Station") + '/' + btoa("Gruppenleiter"));
        return {redirected: true};
    } else if (stationLoggedIn && groupLoggedIn) {
        FlowRouter.go('/input');
    } else if (adminLoggedIn) {
        FlowRouter.go('/config');
    } else if (outputLoggedIn) {
        FlowRouter.go('/output');
    }

    return {
        redirected: false,
        group: {loggedIn: groupLoggedIn, only: !stationLoggedIn && groupLoggedIn},
        station: {loggedIn: stationLoggedIn, only: !groupLoggedIn && stationLoggedIn}
    };
};

login.route("/", {
    action: function () {

        const permission = checkPermission();
        if (permission.redirected) return;

        BlazeLayout.render("login", {
            steps: [
                login_overview,
                {template: "preloader"},
                {template: "preloader"},
                {template: "preloader"}
            ]
        });
    }
});

login.route("/:loginA", {
    action: function (params) {

        const permission = checkPermission();
        if (permission.redirected) return;

        params.loginA = tryDecrypt(params.loginA);

        const steps = [
            login_overview,
            {template: "omni_login", data: {type: params.loginA}},
            {template: "preloader"}
        ];

        if (params.loginA !== "Administrator") steps.push({template: "preloader"});

        BlazeLayout.render("login", {steps: steps});
    }
});

login.route("/:loginA/:loginB", {
    action: function (params) {

        const permission = checkPermission();
        if (permission.redirected) return;

        params.loginA = tryDecrypt(params.loginA);
        params.loginB = tryDecrypt(params.loginB);

        // Show choice to logout or do smth else
        const choices = [
            {title: invertLogin(params.loginA) + " anmelden", type: "continue_login"}
        ];

        if (permission.group.loggedIn) choices.push({title: "Daten einsehen", type: "view_data"});

        choices.push({title: params.loginA + " abmelden", type: "logout"});

        BlazeLayout.render("login", {
            steps: [
                login_overview,
                {template: "omni_login", data: {type: params.loginA}},
                {template: "choices", data: {choices: choices, class: "selection"}},
                {template: "omni_login", data: {type: params.loginB}}
            ]
        });
    }
});

Template.login.onRendered(function () {
    const loginA = tryDecrypt(FlowRouter.getParam("loginA"));
    const loginB = tryDecrypt(FlowRouter.getParam("loginB"));
    if (!loginA && !loginB) {
        goToStep(getLoginSwiper(), 0);
    } else if (loginA && !loginB) {
        goToStep(getLoginSwiper(), 1);
    } else if (loginA && loginB) {
        goToStep(getLoginSwiper(), 2);
        setTimeout(updateSwiperProgress, 1);
    }
});