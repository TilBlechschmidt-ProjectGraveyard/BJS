import {AccountManager} from "../../../api/account_managment/AccountManager";
import {checkPermission} from "./router";
import "./index.html";

function login(event) {
    const type = event.target.dataset.type;
    const password_input = document.querySelectorAll("input[data-type='" + type + "'][type='password']")[0];
    const password = password_input.value;

    if (Meteor.loginInProgress) {
        console.warn("Login already in progress!");
        return;
    }
    Meteor.loginInProgress = true;
    Meteor.f7.showPreloader("Anmelden");

    AccountManager.login(type, password, function (success, err) {
        if (!success) {
            //TODO: Throw something at the user
            Meteor.f7.hidePreloader();
            Meteor.f7.alert(err, "Fehler", function () {
                Meteor.loginInProgress = false;
            });
            password_input.value = "";
            return;
        }

        if (!sessionStorage.getItem("firstLogin"))
            sessionStorage.setItem("firstLogin", type);
        if (checkPermission().redirected)
            nextStep(getLoginSwiper());

        Meteor.inputDependency.changed();

        Meteor.f7.hidePreloader();
        Meteor.loginInProgress = false;
    });
}

export let prevStep = function (swiper) {
    swiper.unlockSwipeToPrev();
    swiper.slidePrev();
    swiper.lockSwipeToPrev();
};

export let nextStep = function (swiper) {
    swiper.unlockSwipeToNext();
    swiper.slideNext();
    swiper.lockSwipeToNext();
};

export let getLoginSwiper = function () {
    if (!document.getElementById('login-swiper')) return false;
    return document.getElementById('login-swiper').swiper;
};

export let goToStep = function (swiper, step) {
    swiper.unlockSwipeToPrev();
    swiper.unlockSwipeToNext();
    swiper.slideTo(step);
    swiper.lockSwipeToNext();
    swiper.lockSwipeToPrev();
};

export let initSwiper = function () {
    Meteor.swiper = Meteor.f7.swiper('.swiper-container', {
        pagination: '.swiper-pagination',
        paginationType: 'progress',
        allowSwipeToNext: false,
        allowSwipeToPrev: false
    });
};

Template.login.helpers({
    firstLoggedIn: function () {
        Meteor.inputDependency.depend();
        return sessionStorage.getItem("firstLogin");
    }
});

Template.login.events({
    'click .overview-choice': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        FlowRouter.go('/login/' + btoa(event.target.dataset.type));
        nextStep(getLoginSwiper());
        setTimeout(function () {
            document.getElementsByClassName("passwort-input")[0].focus();
        }, 400);
        return false;
    },
    'click .selection': function () {
        event.preventDefault();
        event.stopImmediatePropagation();
        const type = event.target.dataset.type;
        if (event.target.dataset.type == "continue_login") {
            nextStep(getLoginSwiper());
            setTimeout(function () {
                document.getElementsByClassName("passwort-input")[1].focus();
            }, 400);
        } else if (type == "view_data")
            FlowRouter.go('/input');
        else if (type == "logout" && sessionStorage.getItem("firstLogin")) {
            Meteor.f7.showPreloader("Abmelden");
            AccountManager.logout(sessionStorage.getItem("firstLogin"));
            sessionStorage.removeItem("firstLogin");
            Meteor.inputDependency.changed();
            checkPermission();
            setTimeout(Meteor.f7.hidePreloader, 500);
        }
        return false;
    },
    'click .login-button': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        login(event);
        return false;
    },
    'click .login-back-button': function (event) {
        const type = event.target.dataset.type;
        document.querySelectorAll("input[data-type='" + type + "'][type='password']")[0].value = "";
        event.preventDefault();
        event.stopImmediatePropagation();
        prevStep(getLoginSwiper());
        return false;
    },
    'keypress input[type="password"]': function (event) {
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