import {InputAccountManager} from "../../../api/account_managment/InputAccountManager";
import {checkPermission} from "./router";

function login(event) {
    const type = event.target.dataset.type;
    const password_input = document.querySelectorAll("input[data-type='" + type + "'][type='password']")[0];
    const password = password_input.value;

    Meteor.f7.showPreloader("Anmelden");

    InputAccountManager.login(type, password, function (success, err) {
        if (!success) {
            //TODO: Throw something at the user
            Meteor.f7.hidePreloader();
            Meteor.f7.alert(err, "Fehler");
            password_input.value = "";
            return;
        }

        if (!sessionStorage.getItem("firstLogin"))
            sessionStorage.setItem("firstLogin", type);


        // checkPermission();
        if (checkPermission())
            nextStep(getLoginSwiper());

        Meteor.inputDependency.changed();
        // selectDefaultAthlete();

        Meteor.f7.hidePreloader();
    });
}

export let nextStep = function (swiper) {
    swiper.unlockSwipeToNext();
    swiper.slideNext();
    swiper.lockSwipeToNext();
};

export let getLoginSwiper = function () {
    return document.getElementById('login-swiper').swiper;
};

export let goToStep = function (swiper, step) {
    swiper.unlockSwipeToNext();
    swiper.slideTo(step);
    swiper.lockSwipeToNext();
};

function onSliderMove() {
    // if (InputAccountManager.inputPermitted()) {
    //     const logout_type = Meteor.firstLogin == "Gruppenleiter" ? "Station" : "Gruppenleiter";
    //     console.log(logout_type);
    // }
    //
    // setTimeout(function () {
    //     getLoginSwiper().once('sliderMove', onSliderMove);
    // }, 200);
}

export let initSwiper = function () {
    Meteor.swiper = Meteor.f7.swiper('.swiper-container', {
        pagination: '.swiper-pagination',
        paginationType: 'progress',
        allowSwipeToNext: false
    });

    Meteor.swiper.once('sliderMove', onSliderMove);
};

export let login_onLoad = function () {

    Template.login.events({
        'click .overview-choice': function (event) {
            FlowRouter.go('/login/' + btoa(event.target.dataset.type));
            nextStep(document.getElementById('login-swiper').swiper);
        },
        'click .login-button': function (event) {
            login(event);
        },
        'keypress input': function (event) {
            if (event.keyCode == 13) {
                if (event.target.dataset.type) login(event);
                event.stopPropagation();
                return false;
            }
        },
    });

    Template.login.onRendered(function () {
        initSwiper();
    });
};