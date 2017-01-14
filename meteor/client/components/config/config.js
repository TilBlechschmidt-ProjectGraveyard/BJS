import {DBInterface} from "../../../imports/api/database/DBInterface";
import {Log} from "../../../imports/api/log";
import {AccountManager} from "../../../imports/api/account_managment/AccountManager";
import {getCompetitionTypeByID} from "../../../imports/api/logic/competition_type";
import {updateSwiperProgress} from "../login/router";
import {codesClean} from "./accessCodes/accessCodes";
import {getCompetitionName} from "./accessCodes/accessCodes";
import {loginStations} from "./accessCodes/accessCodes";
import {loginGroups} from "./accessCodes/accessCodes";
import {loginCustom} from "./accessCodes/accessCodes";

Meteor.config = {};
Meteor.config.log = new Log();

export const dbReady = new Tracker.Dependency();

export const competitions = new ReactiveVar([]);
export const currentCompID = new ReactiveVar("");
export const editMode = new ReactiveVar(false);
const forwardButton = new ReactiveVar(undefined);
const forwardButtonShown = new ReactiveVar(false);

DBInterface.waitForReady(function () {
    Tracker.autorun(function () {
        if (Meteor.f7) Meteor.f7.showIndicator();
        dbReady.depend();
        DBInterface.waitForReady(function () {
            const allCompetitions = Meteor.COLLECTIONS.Contests.handle.find().fetch();
            const comps = {
                writable: [],
                readOnly: []
            };

            const activeCompetition = DBInterface.getActiveContestID();
            for (let competition in allCompetitions) {
                if (!allCompetitions.hasOwnProperty(competition)) continue;
                competition = allCompetitions[competition];

                // --- Populate data ---

                const competitionType = getCompetitionTypeByID(competition.type);
                // Competition type name
                competition.type = competitionType.getInformation().name;

                // Active property
                competition.active = activeCompetition == competition._id;

                // Sport types metadata
                const sportTypes = [];
                for (let sportType in competition.sportTypes) {
                    if (!competition.sportTypes.hasOwnProperty(sportType)) continue;
                    sportTypes.push(competitionType.getSportType(competition.sportTypes[sportType]));
                }
                competition.sportTypes = sportTypes;

                // --- Sort by readOnly attribute ---
                if (competition.readOnly) {
                    comps.readOnly.push(competition);
                } else {
                    comps.writable.push(competition);
                }
            }

            competitions.set(comps);
            Tracker.afterFlush(function () {
                if (Meteor.f7) Meteor.f7.hideIndicator();
            });
        });
    });
});


Template.config.helpers({
    competitions: function () {
        return competitions.get();
    },
    edit: function () {
        return editMode.get();
    },
    forwardButtonShown: function () {
        return forwardButtonShown.get();
    },
    forwardButton: function () {
        return forwardButton.get();
    },
    printButtonShown: function () {
        return codesClean.get();
    },
});

function setState(event, edit) {
    const accordion = event.target.closest(".accordion-item-content");
    currentCompID.set(accordion.dataset.id);
    editMode.set(edit);
}


Template.config.events({
    'click .fwd-button': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        // Check if current one is valid
        document.getElementById("config-swiper").swiper.slideNext();
        return false;
    },
    'click .back-button': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.getElementById("config-swiper").swiper.slidePrev();
        codesClean.set(false);
        return false;
    },
    'click .show-athletes': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setState(event, false);
        document.getElementById("config-swiper").swiper.slideNext();
        return false;
    },
    'click .edit-button': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setState(event, true);
        document.getElementById("config-swiper").swiper.slideNext();
        return false;
    },
    'click .logout-button': function (event) {
        Meteor.f7.confirm("Möchten Sie sich wirklich abmelden?", "Abmelden", function () {
            AccountManager.logout("Administrator");
            sessionStorage.removeItem("firstLogin");
            FlowRouter.go('/login');
            updateSwiperProgress(0);
            return false;
        });
    },
    'click .print-button': function (event) {
        Blaze.saveAsPDF(Template.codes_print,{
            filename: "Zugangscodes_BJS.pdf",
            data: {
                competition_name: getCompetitionName,
                login_stations: loginStations(),
                login_groups: loginGroups(),
                login_custom: loginCustom
            },
        });
    }
});

Template.config.onRendered(function () {
    DBInterface.waitForReady(function () {
        dbReady.changed();

        const leftButtonSwiper = new Swiper('#config-left-button-swiper', {
            effect: 'slide',
            spaceBetween: 50,
            onlyExternal: true
        });

        const nameSwiper = new Swiper('#config-name-swiper', {
            effect: 'slide',
            spaceBetween: 50,
            onlyExternal: true
        });

        const configSwiper = new Swiper('#config-swiper', {
            replaceState: true,
            parallax: true,
            speed: 400,
            spaceBetween: 50,
            onlyExternal: true,
            control: nameSwiper
        });

        configSwiper.on('transitionStart', function (swiper) {
            if (swiper.activeIndex > 0 && swiper.activeIndex < 3) {
                leftButtonSwiper.slideTo(1);
                if (editMode.get()) forwardButtonShown.set(true);
                forwardButton.set("Weiter");
            } else {
                if (swiper.activeIndex == 3)
                    leftButtonSwiper.slideTo(1);
                else
                    leftButtonSwiper.slideTo(0);
                forwardButtonShown.set(false);
            }
        });
    });
});