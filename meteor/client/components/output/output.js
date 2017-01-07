import {Template} from "meteor/templating";
import "./output.html";
import "./resultCollapse.css";
import {DBInterface} from "../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../imports/api/account_managment/AccountManager";
import {updateSwiperProgress} from "../login/router";


Meteor.groups = [];
Meteor.localCertificated = [];
Meteor.groups_deps = new Tracker.Dependency();


// after.update(function (userId, doc, fieldNames, modifier) {
//     let updateRequired = false;
//     if (modifier.hasOwnProperty('$set')) {
//         for (let name in modifier.$set) {
//             if (!modifier.$set.hasOwnProperty(name)) continue;
//
//             if (name === "certificateScore") {
//                 updateRequired = true;
//             }
//         }
//     }
//
//     if (updateRequired) {
//         console.log(modifier);
//     }
// });


export let loadFilterSwiper = function () {
    const filterSwiper = new Swiper('#filter-swiper', {
        effect: 'slide',
        spaceBetween: 50,
        onlyExternal: true
    });
};

export let getFilterSwiper = function () {
    if (!document.getElementById('filter-swiper')) return false;
    return document.getElementById('filter-swiper').swiper;
};

function refresh() {
    // DBInterface.generateCertificates(AccountManager.getOutputAccount().account, function (data) {
    //     Meteor.groups = [];
    //
    //     for (let g in data) {
    //         if (!data.hasOwnProperty(g)) continue;
    //         const athletes = data[g].athletes;
    //
    //         const group = {
    //             name: data[g].name,
    //             hash: btoa(data[g].name),
    //             athleteCount: data[g].athletes.length,
    //             validAthletes: [],
    //             invalidAthletes: [],
    //             doneAthletes: []
    //         };
    //
    //         for (let athlete in athletes) {
    //             if (!athletes.hasOwnProperty(athlete)) continue;
    //             athlete = athletes[athlete];
    //
    //             if (athlete.valid && !athlete.certificateWritten && !lodash.includes(Meteor.localCertificated, athlete.id)) {
    //                 group.validAthletes.push(athlete);
    //             } else if (!athlete.valid && !athlete.certificateWritten) {
    //                 group.invalidAthletes.push(athlete);
    //             } else if (athlete.certificateWritten) {
    //                 group.doneAthletes.push(athlete);
    //             }
    //         }
    //
    //         Meteor.groups.push(group);
    //     }
    //
    //     Meteor.groups_deps.changed();
    //     Tracker.afterFlush(function () {
    //         Meteor.f7.hideIndicator();
    //     });
    // });


    DBInterface.generateCertificates(
        AccountManager.getOutputAccount().account,
        Meteor.COLLECTIONS.Athletes.handle.find({}).fetch(),
        function (data) {
            console.log(data);
        }
    );

    Meteor.groups = ["Test1"];
    Meteor.groups_deps.changed();
        Tracker.afterFlush(function () {
            Meteor.f7.hideIndicator();
        });
}

//noinspection JSUnusedGlobalSymbols
Template.output.helpers({
    groupNames: function () {
        Meteor.groups_deps.depend();

        return _.map(Meteor.groups, function (group) {
            return group.name;
        });
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
    'click #filter-group-link': function (event) {
        console.log('next');
        console.log(getFilterSwiper());
        getFilterSwiper().slideTo(2);
    }
});

Template.output.onRendered(function () {
    Meteor.f7.sortableOpen('.sortable');
    loadFilterSwiper();
    Meteor.f7.showIndicator();
    DBInterface.waitForReady(function () {
        if (!Meteor.COLLECTIONS.Athletes.changeDetector) {
            Meteor.COLLECTIONS.Athletes.changeDetector = true;
            Meteor.COLLECTIONS.Athletes.handle.find().observeChanges({
                changed: function (id, fields) {
                    if (!AccountManager.getOutputAccount().logged_in) return;
                    Meteor.f7.addNotification({
                        title: "Neue Daten",
                        message: "Es wurden neue Daten eingetragen!",
                        hold: 2000,
                        closeOnClick: true,
                    });
                    console.log(fields);
                }
            });
        }
        refresh();
    });


});