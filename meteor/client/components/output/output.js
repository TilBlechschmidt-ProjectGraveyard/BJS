import {Template} from "meteor/templating";
import "./output.html";
import "./resultCollapse.css";
import {DBInterface} from "../../../imports/api/database/db_access";
import {AccountManager} from "../../../imports/api/account_managment/AccountManager";
import {updateSwiperProgress} from "../login/router";


Meteor.groups = [];
Meteor.localCertificated = [];
Meteor.groups_deps = new Tracker.Dependency();

export let reloadSwiper = function () {
    const outputNameSwiperEl = document.getElementById('output-name-swiper');
    const outputSwiperEl = document.getElementById('output-swiper');
    if (outputNameSwiperEl && outputSwiperEl && outputNameSwiperEl.swiper && outputSwiperEl.swiper) {
        outputNameSwiperEl.swiper.destroy(false);
        outputSwiperEl.swiper.destroy(false);
    }

    const nameSwiper = new Swiper('#output-name-swiper', {
        loop: true,
        effect: 'slide',
        spaceBetween: 50,
        onlyExternal: true
    });

    new Swiper('#output-swiper', {
        pagination: '.swiper-pagination',
        paginationType: 'fraction',
        hashnav: true,
        hashnavWatchState: true,
        replaceState: true,
        parallax: true,
        loop: true,
        speed: 400,
        spaceBetween: 50,
        grabCursor: true,
        shortSwipes: true,
        control: nameSwiper
    });
};

function refresh() {
    DBInterface.generateCertificates(AccountManager.getOutputAccount().account, function (data) {
        Meteor.groups = [];

        for (let g in data) {
            if (!data.hasOwnProperty(g)) continue;
            const athletes = data[g].athletes;

            const group = {
                name: data[g].name,
                hash: btoa(data[g].name),
                athleteCount: data[g].athletes.length,
                validAthletes: [],
                invalidAthletes: [],
                doneAthletes: []
            };

            for (let athlete in athletes) {
                if (!athletes.hasOwnProperty(athlete)) continue;
                athlete = athletes[athlete];

                if (athlete.valid && !athlete.certificateWritten && !lodash.includes(Meteor.localCertificated, athlete.id)) {
                    group.validAthletes.push(athlete);
                } else if (!athlete.valid && !athlete.certificateWritten) {
                    group.invalidAthletes.push(athlete);
                } else if (athlete.certificateWritten) {
                    group.doneAthletes.push(athlete);
                }
            }

            Meteor.groups.push(group);
        }

        Meteor.groups_deps.changed();
        Tracker.afterFlush(function () {
            Meteor.f7.hideIndicator();
        });
    });
}

//noinspection JSUnusedGlobalSymbols
Template.output.helpers({
    groups: function () {
        Meteor.groups_deps.depend();

        for (let athleteID in Meteor.localCertificated) {
            if (!Meteor.localCertificated.hasOwnProperty(athleteID)) continue;
            athleteID = Meteor.localCertificated[athleteID];

            for (let group in Meteor.groups) {
                if (!Meteor.groups.hasOwnProperty(group)) continue;
                group = Meteor.groups[group];

                const athlete = lodash.find(group.validAthletes, {id: athleteID});
                if (athlete === undefined) continue;

                athlete.certificateUpdate = false;
                athlete.certificateWritten = true;
                athlete.certificateTime = new Date();
                break;
            }
        }

        return Meteor.groups;
    }
});

Template.output.events({
    'click .logout-button': function () {
        Meteor.f7.confirm("Möchten Sie sich wirklich abmelden?", "Abmelden", function () {
            AccountManager.logout("Urkunden");
            sessionStorage.removeItem("firstLogin");
            FlowRouter.go('/login');
            updateSwiperProgress(0);
            return false;
        });
    },
    'click .group-link': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.getElementById("output-swiper").swiper.slideTo(parseFloat(event.target.dataset.target) + 1);
        Meteor.f7.closeModal();
        return false;
    },
    'click .refresh-link': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        Meteor.f7.closeModal();
        Meteor.f7.showIndicator();
        DBInterface.waitForReady(function () {
            refresh();
            reloadSwiper();
        });
        return false;
    }
});

Template.output.onRendered(function () {
    Meteor.f7.sortableOpen('.sortable');
    Meteor.f7.showIndicator();
    DBInterface.waitForReady(function () {
        refresh();
        reloadSwiper();
    });
});