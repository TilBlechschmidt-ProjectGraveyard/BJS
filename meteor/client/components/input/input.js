import {Template} from "meteor/templating";
import "./input.html";
import "./input.css";
import {Log} from "../../../imports/api/log";
import {DBInterface} from "../../../imports/api/database/DBInterface";
import {arrayify, getAthletes, getLastLogin} from "../helpers";
import {AccountManager} from "../../../imports/api/account_managment/AccountManager";
import {checkPermission, updateSwiperProgress} from "../login/router";

Meteor.input = {};
Meteor.input.log = new Log();

Meteor.inputDependency = new Tracker.Dependency();

export let reloadSwiper = function (forceAthleteReload) {
    const inputNameSwiperEl = document.getElementById('input-name-swiper');
    const inputSwiperEl = document.getElementById('input-swiper');

    if (!inputNameSwiperEl || !inputSwiperEl) return; // check if swipers are ready!

    if (inputNameSwiperEl && inputSwiperEl && inputNameSwiperEl.swiper && inputSwiperEl.swiper) {
        inputNameSwiperEl.swiper.destroy(false);
        inputSwiperEl.swiper.off('transitionEnd');
        inputSwiperEl.swiper.destroy(false);
    }

    const nameSwiper = new Swiper('#input-name-swiper', {
        loop: true,
        effect: 'slide',
        spaceBetween: 50,
        onlyExternal: true
    });

    const inputSwiper = new Swiper('#input-swiper', {
        pagination: '.swiper-pagination',
        paginationType: 'fraction',
        hashnav: true,
        hashnavWatchState: true,
        replaceState: true,
        parallax: true,
        loop: true,
        observer: true,
        speed: 400,
        spaceBetween: 50,
        grabCursor: true,
        shortSwipes: true,
        control: nameSwiper
    });

    // inputSwiper.on('transitionEnd', function (swiper) {
    //     setTimeout(function () {
    //         Session.set("inputSlideIndex", location.hash.substr(1));
    //     }, 200);
    // });
    //
    // if ((!location.hash || forceAthleteReload) && Session.get("inputSlideIndex") !== undefined) {
    //     console.log("SETTING HASH");
    //     const athleteID = Session.get("inputSlideIndex");
    //     setTimeout(function () {
    //         const slides = document.querySelectorAll(".swiper-slide[data-hash]:not(.swiper-slide-duplicate):not(.swiper-slide-duplicate-prev)");
    //         let slideID;
    //         for (slideID in slides) {
    //             if (!slides.hasOwnProperty(slideID)) continue;
    //             if (slides[slideID].dataset.hash == athleteID)
    //                 break;
    //         }
    //         if (slideID === undefined) return;
    //         inputSwiper.slideTo(parseInt(slideID)+1);
    //     }, 500);
    // }
};

function populateAthlete(athlete) {
    if (!DBInterface.isReady()) {
        DBInterface.waitForReady(function () {
            Meteor.inputDependency.changed();
        });
        return {};
    }
    let sportTypes = {};

    if (athlete === undefined) return {};

    const stationAccount = AccountManager.getStationAccount();
    const ct = DBInterface.getCompetitionType();


    athlete.nonPermittedSportTypes = [];
    if (stationAccount.account) {
        for (let sportTypeIndex in stationAccount.account.score_write_permissions) {
            if (!stationAccount.account.score_write_permissions.hasOwnProperty(sportTypeIndex)) continue;
            let sportType = stationAccount.account.score_write_permissions[sportTypeIndex];
            if (athlete.sports.indexOf(sportType) == -1) {
                athlete.nonPermittedSportTypes.push(ct.getSportType(sportType).name);
            }
        }
    }

    let gapKey = "";
    if (stationAccount.logged_in) {
        // Return all sport types that can be written to with the current station account
        const stIDs = stationAccount.account.score_write_permissions;
        for (let stID in stIDs) {
            if (!stIDs.hasOwnProperty(stID) || !lodash.includes(athlete.sports, stIDs[stID])) continue;
            stID = stIDs[stID];
            gapKey = stID;
            sportTypes[stID] = DBInterface.getCompetitionType().getSportType(stID);
        }
    }


    // Add all other sport types we don't have write permission for but the athlete is permitted to perform
    let athleteSportTypes = lodash.map(athlete.sports, ct.getSportType);
    for (let index in athleteSportTypes) {
        if (!athleteSportTypes.hasOwnProperty(index)) continue;
        let sportType = athleteSportTypes[index];
        if (sportTypes.hasOwnProperty(sportType.id)) continue;
        sportTypes[sportType.id] = sportType;
    }

    // Fetch the measurements
    const read_only_measurements = athlete.getPlain(Meteor.input.log, [AccountManager.getGroupAccount().account], false);

    athlete.sportType = {};
    let stID;

    // Insert the metadata for the sportTypes
    for (let index in sportTypes) {
        stID = sportTypes[index].id;
        if (!athlete.sportType[stID]) athlete.sportType[stID] = {};
        athlete.sportType[stID].metadata = sportTypes[index];
        athlete.sportType[stID].measurements = [];
    }

    // Insert the read_only_measurements into the athlete object
    for (let measurement_block in read_only_measurements) {
        if (!read_only_measurements.hasOwnProperty(measurement_block)) continue;
        measurement_block = read_only_measurements[measurement_block];

        stID = measurement_block.stID.data;
        if (athlete.sportType[stID].measurements === undefined) athlete.sportType[stID].measurements = [];
        athlete.sportType[stID].measurements = athlete.sportType[stID].measurements.concat(
            lodash.map(measurement_block.measurements.data, function (measurement) {
                return {read_only: true, value: measurement, synced: measurement_block.synced};
            })
        );
    }

    // Insert the read-write data from the current session
    if (stationAccount.account && sessionStorage.getItem("measurements")) {
        const measurements = JSON.parse(sessionStorage.getItem("measurements"))[athlete.id];
        for (let sportType in measurements) {
            if (!measurements.hasOwnProperty(sportType)) continue;
            const data = lodash.map(measurements[sportType], function (entry) {
                return {read_only: false, value: entry, synced: false};
            });
            athlete.sportType[sportType].measurements = athlete.sportType[sportType].measurements.concat(data);
        }
    }

    athlete.sportType = arrayify(athlete.sportType);

    // Remove unused sportTypes (skipping the ones we have write permission for) and add a write_permission flag
    let write_permissions = [];
    if (stationAccount.account)
        write_permissions = stationAccount.account.score_write_permissions;

    athlete.sportType = lodash.map(athlete.sportType, function (element) {
        const write_permission = lodash.includes(write_permissions, element.metadata.id);
        if (write_permission || element.measurements.length > 0) {
            element.metadata.write_permission = write_permission;
            return element;
        }
    });

    let gapRequired = false;
    athlete.sportType = lodash.remove(athlete.sportType, function (e) {
        if (e && !e.metadata.write_permission && gapKey !== "") {
            gapRequired = true;
        }
        return e !== undefined;
    });

    athlete.sportType = _.map(athlete.sportType, function (element) {

        if (gapRequired && element.name === gapKey) {
            element.gap = true;
        }


        if (element.metadata.unit === "min:s") {
            element.metadata.inputType = "text";
            for (let m in element.measurements) {
                if (!element.measurements.hasOwnProperty(m)) continue;
                const min = Math.floor(element.measurements[m].value / 60);
                const s = element.measurements[m].value - min * 60;
                if (s < 10) {
                    element.measurements[m].strValue = min + ":0" + s;
                } else {
                    element.measurements[m].strValue = min + ":" + s;
                }
            }
        } else {
            element.metadata.inputType = "number";
            for (let m in element.measurements) {
                if (!element.measurements.hasOwnProperty(m)) continue;
                element.measurements[m].strValue = element.measurements[m].value.toString();
            }
        }
        return element;
    });

    return athlete;
}

//noinspection JSUnusedGlobalSymbols
Template.input.helpers({
    both_logged_in: function () {
        return AccountManager.inputPermitted();
    },
    last_login: function () {
        return getLastLogin();
    },
    athletes: function () {
        Meteor.inputDependency.depend();
        let athletes = lodash.sortBy(getAthletes(), 'lastName');

        // Setting show male/female
        const showFemale = Session.get("showFemale");
        const showMale = Session.get("showMale");

        if (!(showMale && showFemale)) {
            lodash.remove(athletes, function (athlete) {
                const isMale = athlete.isMale;
                return !((showMale && isMale) || (showFemale && !isMale));
            });
        }

        const sortMW = Session.get("groupBySex");

        if (sortMW !== undefined && sortMW) {
            const m = lodash.remove(athletes, function (athlete) {
                return !athlete.isMale;
            });
            const w = lodash.remove(athletes, function (athlete) {
                return athlete.isMale;
            });
            athletes = w.concat(m);
        }

        reloadSwiper();

        return lodash.map(athletes, function (athlete) {
            return populateAthlete(athlete);
        });
    },
    sportTypes: function () {
        if (!DBInterface.isReady()) {
            const dbDep = new Tracker.Dependency();
            dbDep.depend();
            DBInterface.waitForReady(function () {
                dbDep.changed();
            });
            return [];
        }
        const competitionType = DBInterface.getCompetitionType();
        return lodash.map(DBInterface.getCompetitionSportTypes(), function (stID) {
            return competitionType.getSportType(stID);
        });
    }
});

Template.input.events({
    'click #link_next': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.getElementById("input-swiper").swiper.slideNext();
        return false;
    },
    'click #link_prev': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.getElementById("input-swiper").swiper.slidePrev();
        return false;
    },
    'click .logout-button': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.target.blur();
        AccountManager.logout(getLastLogin());
        Meteor.inputDependency.changed();
        return false;
    },
    'click .return-to-login': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        checkPermission();
        setTimeout(updateSwiperProgress, 1);
        return false;
    },
    'click .athlete-link': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.getElementById("input-swiper").swiper.slideTo(parseFloat(event.target.dataset.target) + 1);
        Meteor.f7.closeModal();
        return false;
    }
});


Template.input.onRendered(function () {
    DBInterface.waitForReady(function () {
        reloadSwiper();
    });
});