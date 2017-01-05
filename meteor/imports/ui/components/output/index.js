import {Template} from "meteor/templating";
import "./index.html";
import "./resultCollapse.css";
import "./icons.scss";
import {DBInterface} from "../../../api/database/db_access";
import {AccountManager} from "../../../api/account_managment/AccountManager";
import {updateSwiperProgress} from "../login/router";


let groups = [];
let localCertificated = [];
const groups_deps = new Tracker.Dependency();

function reloadSwiper() {
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
        // observer: true,
        speed: 400,
        spaceBetween: 50,
        grabCursor: true,
        shortSwipes: true,
        control: nameSwiper
    });
}

function refresh() {
    DBInterface.generateCertificates(AccountManager.getOutputAccount().account, function (data) {
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

                if (athlete.valid && !athlete.certificateWritten && !lodash.includes(localCertificated, athlete.id)) {
                    group.validAthletes.push(athlete);
                } else if (!athlete.valid && !athlete.certificateWritten) {
                    group.invalidAthletes.push(athlete);
                } else if (athlete.certificateWritten) {
                    group.doneAthletes.push(athlete);
                }
            }

            groups.push(group);
        }

        groups_deps.changed();
        Tracker.afterFlush(function () {
            Meteor.f7.hidePreloader();
        });
    });
}

//noinspection JSUnusedGlobalSymbols
Template.output.helpers({
    groups: function () {
        groups_deps.depend();

        for (let athleteID in localCertificated) {
            if (!localCertificated.hasOwnProperty(athleteID)) continue;
            athleteID = localCertificated[athleteID];

            for (let group in groups) {
                if (!groups.hasOwnProperty(group)) continue;
                group = groups[group];

                const athlete = lodash.find(group.validAthletes, {id: athleteID});
                if (athlete === undefined) continue;

                athlete.certificateWritten = true;
                athlete.certificateTime = new Date();
                break;
            }
        }

        return groups;
    }
});

Template.result.helpers({
    humanReadableDate: function (timestamp) {
        const date = new Date(timestamp);

        let monthNames = [
            "January", "February", "March",
            "April", "May", "June", "July",
            "August", "September", "October",
            "November", "December"
        ];

        let hours = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();
        let day = date.getDate();
        let monthIndex = date.getMonth();
        let year = date.getFullYear();

        return hours + ':' + minutes + ':' + seconds; //', ' + day + ' ' + monthNames[monthIndex] + ' ' + year;
    }
});

Template.result.events({
    'click .open-detail-view': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        Meteor.f7.popup('.popup-detail-' + event.target.dataset.id);
        return false;
    },
    'click .accordion-item': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        Meteor.f7.accordionToggle(event.target.closest(".accordion-item"));
        return false;
    },
    'click .signCertificate': function (event) {
        console.log("Signed certificate");
        localCertificated.push(event.target.dataset.id);
        event.target.closest(".accordion-item").dataset.collapse = "true";
        setTimeout(function () {
            groups_deps.changed();
            Tracker.afterFlush(function () {
                setTimeout(function () {
                    const accordionItem = document.querySelector(".accordion-item[data-collapse='true']");
                    accordionItem.className = accordionItem.className + " collapsed";
                    accordionItem.dataset.collapse = "";
                    // TODO: Move the item in the groups collection down to "doneAthletes" after the animation time of 1000ms
                }, 1200);
            });
        }, 200);
        DBInterface.certificateUpdate(AccountManager.getOutputAccount().account, event.target.dataset.id);
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
    }
});

Template.output.onRendered(function () {
    Meteor.f7.showPreloader("Daten werden geladen");
    DBInterface.waitForReady(function () {
        refresh();
        reloadSwiper();
    });
});

Template.groupCertificates.onRendered(function () {
    reloadSwiper();
});