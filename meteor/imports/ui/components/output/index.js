import {Template} from "meteor/templating";
import "./index.html";
import "./checkmark.scss";
import {DBInterface} from "../../../api/database/db_access";
import {AccountManager} from "../../../api/account_managment/AccountManager";
import {updateSwiperProgress} from "../login/router";


let groups = [];
let current_group = -1;
const groups_deps = new Tracker.Dependency();

let localCertificated = [];
const localCertificated_deps = new Tracker.Dependency();

function refresh() {
    DBInterface.generateCertificates(AccountManager.getOutputAccount().account, function (data) {
        groups = data;
        current_group = 0;
        groups_deps.changed();
    });
}

Template.output.onRendered(function () {
    DBInterface.waitForReady(function () {
        refresh();
    });
});

function getAthletesOfGroup() {
    const athletes = lodash.sortBy(groups[current_group].athletes, "valid").reverse();
    for (let athlete in localCertificated) {
        if (!localCertificated.hasOwnProperty(athlete)) continue;
        const athlete = lodash.find(athletes, {id: localCertificated[athlete]});
        athlete.certificateWritten = true;
        athlete.certificateTime = new Date();
    }
    return athletes;
}

//noinspection JSUnusedGlobalSymbols
Template.output.helpers({
    list_groups: function () {
        groups_deps.depend();

        return _.map(groups, function (group) {
            return group.name;
        });
    },
    athletes: function () {
        groups_deps.depend();
        localCertificated_deps.depend();
        if (current_group == -1) return [];
        return lodash.remove(getAthletesOfGroup(), function (athlete) {
            return !(athlete.certificateWritten && !lodash.includes(localCertificated, athlete.id));
        });
    },
    doneAthletes: function () {
        groups_deps.depend();
        if (current_group == -1) return [];
        return lodash.remove(getAthletesOfGroup(), function (athlete) {
            return athlete.certificateWritten;
        });
    },
    get_groupname: function () {
        groups_deps.depend();
        if (current_group == -1) return "Daten laden...";
        return groups[current_group].name;
    },
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

Template.output.events({
    'click .accordion-item': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        Meteor.f7.accordionToggle(event.target.closest(".accordion-item"));
        return false;
    },
    'click .signCertificate': function (event) {
        localCertificated.push(event.target.dataset.id);
        const accordion = event.target.closest('.accordion-item');
        setTimeout(function () {
            localCertificated_deps.changed();
        }, 200);
        DBInterface.certificateUpdate(AccountManager.getOutputAccount().account, event.target.dataset.id);
    },
    'click .group-selector': function (event) {
        current_group = event.target.closest("li").dataset.id;
        Meteor.f7.closePanel();
        groups_deps.changed();
    },
    'click #btn_refresh': refresh,
    'click .logout-button': function (event) {
        Meteor.f7.confirm("Möchten Sie sich wirklich abmelden?", "Abmelden", function () {
            AccountManager.logout("Urkunden");
            sessionStorage.removeItem("firstLogin");
            FlowRouter.go('/login');
            updateSwiperProgress(0);
            return false;
        });
    },
});