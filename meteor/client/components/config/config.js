import {DBInterface} from "../../../imports/api/database/DBInterface";
import {Log} from "../../../imports/api/log";
import {AccountManager} from "../../../imports/api/account_managment/AccountManager";
import {getCompetitionTypeByID} from "../../../imports/api/logic/competition_type";
import {updateSwiperProgress} from "../login/router";

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
        Meteor.f7.showIndicator();
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
            Tracker.afterFlush(Meteor.f7.hideIndicator);
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
        if (forwardButton.get() == "Fertigstellen") {
            Meteor.f7.confirm("Nach der Fertigstellung können sie den Wettkampf nichtmehr editieren und die Passwörter nichtmehr einsehen! Sind sie sicher, dass sie fortfahren wollen?", "Warnung", function () {
                Meteor.f7.showPreloader("Speichere Wettkampf");
                console.log("writing thingy");
            });
        } else {
            document.getElementById("config-swiper").swiper.slideNext();
        }
        return false;
    },
    'click .back-button': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.getElementById("config-swiper").swiper.slidePrev();
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
    'click .logout-button': function () {
        Meteor.f7.confirm("Möchten Sie sich wirklich abmelden?", "Abmelden", function () {
            AccountManager.logout("Administrator");
            sessionStorage.removeItem("firstLogin");
            FlowRouter.go('/login');
            updateSwiperProgress(0);
            return false;
        });
    },
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
            if (swiper.activeIndex == 3) {
                leftButtonSwiper.slideTo(1);
                if (editMode.get()) forwardButtonShown.set(true);
                forwardButton.set("Fertigstellen");
            } else if (swiper.activeIndex > 0) {
                leftButtonSwiper.slideTo(1);
                if (editMode.get()) forwardButtonShown.set(true);
                forwardButton.set("Weiter");
            } else {
                leftButtonSwiper.slideTo(0);
                forwardButtonShown.set(false);
            }
        });
    });
});