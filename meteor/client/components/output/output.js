import {Template} from "meteor/templating";
import "./output.html";
import "./resultCollapse.css";
import {DBInterface} from "../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../imports/api/account_managment/AccountManager";
import {updateSwiperProgress} from "../login/router";
import {ReactiveVar} from "meteor/reactive-var";

const reactiveAthletes = new ReactiveVar([]);
const groupSettings = new ReactiveVar({text: "Keine"});
const genderSettings = new ReactiveVar({m: true, w: true, text: "Alle"});
const statusSettings = new ReactiveVar({ready: true, notReady: true, finish: true, text: "Alle"});

function loadAllAthlets() {
    DBInterface.generateCertificates(
        AccountManager.getOutputAccount().account,
        _.map(Meteor.COLLECTIONS.Athletes.handle.find({}).fetch(), function (enc_athlete) {
            return enc_athlete._id
        }),
        function (data) {
            reactiveAthletes.set(data);
            updatedGroups();
            Meteor.f7.hideIndicator();
        }
    );
}

function getGroupsFromAthletes() {
    const groupNames = [];
    const athletes = reactiveAthletes.get();

    for (let athleteIndex in athletes) {
        if (!athletes.hasOwnProperty(athleteIndex)) continue;
        if (groupNames.indexOf(athletes[athleteIndex].group) == -1) {
            groupNames.push(athletes[athleteIndex].group);
        }
    }

    return groupNames;
}


function updatedGroups() {
    const groupNames = getGroupsFromAthletes();
    const settingData = {};
    _.forEach(groupNames, function (name) {
        settingData[name] = false;
    });
    settingData[groupNames[0]] = true;
    settingData.text = groupNames[0];
    groupSettings.set(settingData);
}

function countTrue(list) {
    let counter = 0;

    for (let a in list) {
        if (!list.hasOwnProperty(a)) continue;
        if (list[a] == true) { //== true required because list[a] might be an object
            counter += 1;
        }
    }
    return counter;
}

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


    // Meteor.groups = ["Test1"];
    // Meteor.groups_deps.changed();
    //     Tracker.afterFlush(function () {
    //         Meteor.f7.hideIndicator();
    //     });
}

//noinspection JSUnusedGlobalSymbols
Template.output.helpers({
    genderSettings: function () {
        return genderSettings.get();
    },
    statusSettings: function () {
        return statusSettings.get();
    },
    groupSettings: function () {
        return groupSettings.get();
    },
    groupChecked: function (name) {
        return groupSettings.get()[name] ? "checked" : "";
    },
    checked: function (b) {
        return b ? "checked" : "";
    },
    groupNames: function () {
        return getGroupsFromAthletes();
    },
    uiElements: function () {

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
    'click .checkbox': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();


        //Smart titles + toggle, Don't touch!!
        if (event.target.dataset.type === "gender") {
            const data = genderSettings.get();
            data[event.target.dataset.attr] = !data[event.target.dataset.attr];
            const cTrue = countTrue(data);
            if (cTrue == 2) data.text = "Alle";
            else if (cTrue == 1 && data.m) data.text = "Männlich";
            else if (cTrue == 1) data.text = "Weiblich";
            else data.text = "Keine";

            genderSettings.set(data);
        } else if (event.target.dataset.type === "status") {
            const data = statusSettings.get();
            data[event.target.dataset.attr] = !data[event.target.dataset.attr];
            const cTrue = countTrue(data);
            if (cTrue == 3) data.text = "Alle";
            else if (cTrue == 0) data.text = "Keine";
            else if (cTrue == 1) {
                if (data.ready) data.text = "Bereit";
                else if (data.notReady) data.text = "Nicht Bereit";
                else data.text = "Fertig";
            }
            else {
                if (!data.ready) data.text = "Außer Bereit";
                else if (!data.notReady) data.text = "Bereit und Fertig";
                else data.text = "Außer Fertig";
            }
            statusSettings.set(data);
        } else if (event.target.dataset.type === "group") {
            const data = groupSettings.get();
            data[event.target.dataset.attr] = !data[event.target.dataset.attr];
            const cTrue = countTrue(data);
            if (cTrue == 0) data.text = "Keine";
            else if (cTrue == 1) {
                for (let a in data) {
                    if (!data.hasOwnProperty(a)) continue;
                    if (data[a] == true) { //== true required because list[a] might be an object
                        data.text = a;
                        break;
                    }
                }
            }
            else if (cTrue == Object.keys(data).length - 1) data.text = "Alle";
            else data.text = "Mehrere";
            groupSettings.set(data);
        }
    }
});

Template.output.onRendered(function () {
    Meteor.f7.sortableOpen('.sortable');
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

                    DBInterface.generateCertificates(
                        AccountManager.getOutputAccount().account, [id], function (data) {
                            const athletes = reactiveAthletes.get();
                            for (let i in athletes) {
                                if (!athletes.hasOwnProperty(i)) continue;
                                if (athletes[i].id == id) {
                                    athletes[i] = data[0];
                                }
                            }
                            reactiveAthletes.set(athletes);
                            updatedGroups();
                        }
                    );
                }
            });
        }
        loadAllAthlets();
    });


});