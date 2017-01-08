import {DBInterface} from "../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../imports/api/account_managment/AccountManager";
import {getCompetitionTypeByID} from "../../../imports/api/logic/competition_type";
import {updateSwiperProgress} from "../login/router";

export const dbReady = new Tracker.Dependency();

export const competitions = new ReactiveVar([]);
export const currentCompID = new ReactiveVar("");
export const editMode = new ReactiveVar(false);

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
    }
});

function setState(event, edit) {
    const accordion = event.target.closest(".accordion-item-content");
    currentCompID.set(accordion.dataset.id);
    editMode.set(edit);
}


Template.config.events({
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

        const nameSwiper = new Swiper('#config-name-swiper', {
            effect: 'slide',
            spaceBetween: 50,
            onlyExternal: true
        });

        new Swiper('#config-swiper', {
            replaceState: true,
            parallax: true,
            speed: 400,
            spaceBetween: 50,
            onlyExternal: true,
            control: nameSwiper
        });
    });
});