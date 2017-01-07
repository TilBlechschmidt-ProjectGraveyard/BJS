import {DBInterface} from "../../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../../imports/api/account_managment/AccountManager";
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

Template.result.events({
    'click .open-detail-view': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        Meteor.f7.popup('.popup-detail-' + event.target.dataset.id);
        return false;
    },
    'click .signCertificate': function (event) {
        const athleteID = event.target.dataset.id;
        Meteor.localCertificated.push(athleteID);
        event.target.closest(".accordion-item").dataset.collapse = "true";
        // Wait for accordion to collapse
        setTimeout(function () {
            Meteor.groups_deps.changed();
            Tracker.afterFlush(function () {
                // Wait for checkmark animation
                setTimeout(function () {
                    const accordionItem = document.querySelector(".accordion-item[data-collapse='true']");
                    accordionItem.className = accordionItem.className + " collapsed";
                    accordionItem.dataset.collapse = "";

                    // Wait for collapse animation
                    setTimeout(function () {
                        let oldAthleteID;
                        let oldGroupID;
                        let oldAthlete;
                        outerLoop:
                            for (let group in Meteor.groups) {
                                if (!Meteor.groups.hasOwnProperty(group)) continue;

                                const validAthletes = Meteor.groups[group].validAthletes;
                                for (let athlete in validAthletes) {
                                    if (!validAthletes.hasOwnProperty(athlete)) continue;
                                    if (validAthletes[athlete].id == athleteID) {
                                        oldAthlete = validAthletes[athlete];
                                        oldAthleteID = athlete;
                                        oldGroupID = group;
                                        break outerLoop;
                                    }
                                }

                            }
                        oldAthlete.moved = true;
                        Meteor.groups[oldGroupID].doneAthletes.push(oldAthlete);
                        Meteor.groups[oldGroupID].validAthletes[oldAthleteID] = {}; // Overwrite object instead of removing it to prevent blaze from replacing its content
                        Meteor.groups_deps.changed();
                    }, 1000);
                }, 1200);
            });
        }, 200);
        DBInterface.certificateUpdate(AccountManager.getOutputAccount().account, event.target.dataset.id);
    }
});