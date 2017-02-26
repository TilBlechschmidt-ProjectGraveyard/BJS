import {Server} from "../../../imports/api/database/ServerInterface";
import {Log} from "../../../imports/api/log";
import {AccountManager} from "../../../imports/api/accountManagement/AccountManager";
import {getContestTypeByID} from "../../../imports/api/logic/contestType";
import {updateSwiperProgress} from "../login/router";
import {
    codesClean,
    clearACs,
    getContestName,
    loginStations,
    loginGroups,
    loginCustom,
    accessCodes
} from "./accessCodes/accessCodes";
import {showIndicator, hideIndicator} from "../helpers";
import {parseCSVFile} from "./athleteList/csv";

Meteor.config = {};
Meteor.config.log = Log.getLogObject();

export const dbReady = new Tracker.Dependency();

export const currentSlide = new ReactiveVar(0);
export const contests = new ReactiveVar([]);
export const currentCompID = new ReactiveVar("");
export const editMode = new ReactiveVar(false);
export const forwardIcon = new ReactiveVar(undefined);
const forwardButton = new ReactiveVar(undefined);
const forwardButtonShown = new ReactiveVar(false);
const ServerIPs = new ReactiveVar([]);

Server.db.waitForReady(function () {
    Tracker.autorun(async function () {
        showIndicator();
        dbReady.depend();

        if (!AccountManager.getAdminAccount().account) {
            hideIndicator();
            return undefined;
        }

        const allContests = Meteor.COLLECTIONS.Contests.handle.find().fetch();
        const comps = {
            writable: [],
            readOnly: []
        };

        const activeContest = Server.contest.getActiveID();
        for (let contest in allContests) {
            if (!allContests.hasOwnProperty(contest)) continue;
            contest = allContests[contest];

            // --- Populate data ---

            // Athlete count (wait for promise to resolve)
            contest.athleteCount = await Server.athletes.count(AccountManager.getAdminAccount().account, contest._id);

            // Contest type name
            const contestType = getContestTypeByID(contest.type);
            contest.type = contestType.getInformation().name;

            // Active property
            contest.active = activeContest == contest._id;

            // Sport types metadata
            const sportTypes = [];
            for (let sportType in contest.sportTypes) {
                if (!contest.sportTypes.hasOwnProperty(sportType)) continue;
                sportTypes.push(contestType.getSportType(contest.sportTypes[sportType]));
            }
            contest.sportTypes = sportTypes;

            // --- Sort by readOnly attribute ---
            if (contest.readOnly) {
                comps.readOnly.push(contest);
            } else {
                comps.writable.push(contest);
            }
        }

        contests.set(comps);
        Tracker.afterFlush(hideIndicator);
    });
});

Template.config.onRendered( function () {
    Server.getIPs(AccountManager.getAdminAccount().account, function (data) {
        ServerIPs.set(data);
    })
});


Template.config.helpers({
    contests: function () {
        return contests.get();
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
            Meteor.f7.confirm("Wenn Sie diese Seite verlassen werden alle Zugangsdaten gelöscht und müssen neu erzeugt werden!", "Warnung", function () {
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
    'click .print-button-txt': function (event) {
        const acs = accessCodes.get();

        let content = "Zugangscodes:\n";

        for (let g in acs) {
            if (!acs.hasOwnProperty(g)) continue;
            const g_data = acs[g];

            if (g_data["codes"].length > 0) {
                content += "\n" + g_data["name"] + "\n";
                for (let ac in g_data["codes"]) {
                    if (!g_data["codes"].hasOwnProperty(ac)) continue;
                    content += g_data["codes"][ac]["name"] + ": " + g_data["codes"][ac]["code"] + "\n";
                }
            }
        }

        const uriContent = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
        window.open(uriContent, 'Zugangscodes.txt');
    },
    'click .print-button-html': function (event) {
        const acs = accessCodes.get();

        let content = "<html><head><style>tr:nth-of-type(even){background-color:#eee;}</style></head><body onload='setTimeout(window.print, 500);'><font face='Ubuntu'><h1>Zugangscodes</h1>";

        for (let g in acs) {
            if (!acs.hasOwnProperty(g)) continue;
            const g_data = acs[g];

            if (g_data["codes"].length > 0) {
                content += "<br><h3>" + g_data["name"] + "</h3><table style='width:100%'>";
                for (let ac in g_data["codes"]) {
                    if (!g_data["codes"].hasOwnProperty(ac)) continue;
                    content += "<tr><td style='width: 60%'>" + g_data["codes"][ac]["name"] + "</td><td style='width: 40%'>" + g_data["codes"][ac]["code"] + "</td></tr>";
                }
                content += "</table>";
            }
        }

        content += "</font></body></html>";

        const uriContent = "data:text/html;charset=utf-8," + encodeURIComponent(content);
        window.open(uriContent, 'Zugangscodes.txt');
    },
    'click .download-button': function (event) {
        Blaze.saveAsPDF(Template.codes_print,{
            filename: "Zugangscodes_BJS.pdf",
            data: {
                contest_name: getContestName,
                login_stations: loginStations(),
                login_groups: loginGroups(),
                login_custom: loginCustom
            },
        });
    },
    'drop .csv-dropzone': function drop_handler(event) {
        event.preventDefault();

        // // If dropped items aren't files, reject them
        const dt = event.originalEvent.dataTransfer;
        if (dt.items) {
            // Use DataTransferItemList interface to access the file(s)
            if (dt.items.length == 0) return;
            parseCSVFile(dt.items[0].getAsFile());
            Meteor.f7.popup(".popup-csv-import");
        } else {
            // Use DataTransfer interface to access the file(s)
            if (dt.files.length == 0) return;
            parseCSVFile(dt.files[0]);
            Meteor.f7.popup(".popup-csv-import");
        }
    },
    'dragover .csv-dropzone': function dragover_handler(ev) {
        // Prevent default select and drag behavior
        ev.preventDefault();
    },
    'dragend .csv-dropzone': function dragend_handler(ev) {
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
    Server.db.waitForReady(function () {
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