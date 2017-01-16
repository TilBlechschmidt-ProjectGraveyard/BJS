import {DBInterface} from "../../../imports/api/database/DBInterface";
import {Log} from "../../../imports/api/log";
import {AccountManager} from "../../../imports/api/account_managment/AccountManager";
import {getCompetitionTypeByID} from "../../../imports/api/logic/competition_type";
import {updateSwiperProgress} from "../login/router";
import {
    codesClean,
    clearACs,
    getCompetitionName,
    loginStations,
    loginGroups,
    loginCustom
} from "./accessCodes/accessCodes";
import {showIndicator, hideIndicator} from "../helpers";
import {parseCSVFile} from "./athleteList/csv";

Meteor.config = {};
Meteor.config.log = Log.getLogObject();

export const dbReady = new Tracker.Dependency();

export const currentSlide = new ReactiveVar(0);
export const competitions = new ReactiveVar([]);
export const currentCompID = new ReactiveVar("");
export const editMode = new ReactiveVar(false);
export const forwardIcon = new ReactiveVar(undefined);
const forwardButton = new ReactiveVar(undefined);
const forwardButtonShown = new ReactiveVar(false);
const ServerIPs = new ReactiveVar([]);

DBInterface.waitForReady(function () {
    Tracker.autorun(async function () {
        showIndicator();
        dbReady.depend();

        if (!AccountManager.getAdminAccount().account) {
            hideIndicator();
            return undefined;
        }

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

            // Athlete count (wait for promise to resolve)
            competition.athleteCount = await DBInterface.getAthleteCountByCompetition(AccountManager.getAdminAccount().account, competition._id);

            // Competition type name
            const competitionType = getCompetitionTypeByID(competition.type);
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
        Tracker.afterFlush(hideIndicator);
    });
});

Template.config.onRendered( function () {
    DBInterface.getServerIPs(AccountManager.getAdminAccount().account, function (data) {
        ServerIPs.set(data);
    })
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
    forwardIcon: function () {
        if (currentSlide.get() == 2)
            return forwardIcon.get();
        else
            return undefined;
    },
    ServerIPList: function () {
        return ServerIPs.get();
    }
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
        const swiper = document.getElementById("config-swiper").swiper;
        if (swiper.activeIndex == 3 && codesClean.get()) {
            Meteor.f7.confirm("Wenn sie diese Seite verlassen werden alle Zugangsdaten gelöscht und müssen neu erzeugt werden!", "Warnung", function () {
                swiper.slidePrev();
                codesClean.set(false);
                clearACs();
            });
        } else
            swiper.slidePrev();
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
        window.print();
    },
    'click .download-button': function (event) {
        Blaze.saveAsPDF(Template.codes_print,{
            filename: "Zugangscodes_BJS.pdf",
            data: {
                competition_name: getCompetitionName,
                login_stations: loginStations(),
                login_groups: loginGroups(),
                login_custom: loginCustom
            },
        });
    },
    'drop .csv-dropzone': function drop_handler(ev) {
        let i;
        // console.log("Drop");
        ev.preventDefault();
        // If dropped items aren't files, reject them
        const dt = ev.originalEvent.dataTransfer;
        if (dt.items) {
            // Use DataTransferItemList interface to access the file(s)
            for (i = 0; i < dt.items.length; i++) {
                if (dt.items[i].kind == "file") {
                    const f = dt.items[i].getAsFile();
                    // console.log("... file[" + i + "].name = " + f.name);
                    // console.log("... file[" + i + "] = ", f);
                    parseCSVFile(f);
                }
            }
        } else {
            // Use DataTransfer interface to access the file(s)
            for (i = 0; i < dt.files.length; i++) {
                // console.log("... file[" + i + "].name = " + dt.files[i].name);
                // console.log("... file[" + i + "] = ", dt.files[i]);
                parseCSVFile(dt.files[i]);
            }
        }
    },
    'dragover .csv-dropzone': function dragover_handler(ev) {
        // console.log("dragOver");
        // Prevent default select and drag behavior
        ev.preventDefault();
    },
    'dragend .csv-dropzone': function dragend_handler(ev) {
        // console.log("dragEnd");
        // Remove all of the drag data
        const dt = ev.dataTransfer;
        if (dt.items) {
            // Use DataTransferItemList interface to remove the drag data
            for (let i = 0; i < dt.items.length; i++) {
                dt.items.remove(i);
            }
        } else {
            // Use DataTransfer interface to remove the drag data
            ev.dataTransfer.clearData();
        }
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
            currentSlide.set(swiper.activeIndex);
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