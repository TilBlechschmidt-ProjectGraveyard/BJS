import {DBInterface} from "../../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../../imports/api/account_managment/AccountManager";
import {findIndexOfAthlete} from "../helpers";


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
    },
    autoOpen: function (athlete) {
        if (athlete.manual != undefined) {
            return athlete.manual;
        } else {
            return athlete.valid && !athlete.certificateWritten;
        }
    },
    isEqual: function (a, b) {
        return a == b;
    },
    show: function (athlete) {
        return !athlete.hide;
    }
});

Template.result.events({
    'click .open-detail-view': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        Meteor.f7.popup('.popup-detail-' + event.target.dataset.id);
        return false;
    },
    'click .signCertificate': function (event) {
        const id = event.target.dataset.id;
        DBInterface.certificateUpdate(AccountManager.getOutputAccount().account, id);

        const athletes = Meteor.reactiveAthletes.get();
        const index = findIndexOfAthlete(athletes, id);
        athletes[index].iconID = 4;
        Meteor.reactiveAthletes.set(athletes);
    }
});