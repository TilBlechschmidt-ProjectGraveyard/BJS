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
const statusSettings = new ReactiveVar({ready: true, update: true, notReady: true, finish: true, text: "Alle"});

const baseSortingData = [
    {
        id: 0,
        name: "Urkundenstatus",
        icon: "tags",
        sort: function (a, b) {
            return statusToNumber(a) - statusToNumber(b);
        },
        getGroupName: function (a) {
            if (isReady(a)) return "Bereit";
            if (isUpdate(a)) return "Neu Erstellen";
            if (isNotReady(a)) return "Nicht Bereit";
            if (isFinish(a)) return "Fertig";
        }
    },
    {
        id: 1,
        name: "Urkundentype",
        icon: "document_text",
        sort: function (a, b) {
            return b.certificate - a.certificate;
        },
        getGroupName: function (a) {
            return a.certificateName;
        }
    },
    {
        id: 2,
        name: "Nachname",
        icon: "person",
        sort: function (a, b) {
            return a.lastName.localeCompare(b.lastName);
        },
        getGroupName: function (a) {
            return "Alle";
        }
    },
    {
        id: 3,
        name: "Vorname",
        icon: "person",
        sort: function (a, b) {
            return a.firstName.localeCompare(b.firstName);
        },
        getGroupName: function (a) {
            return "Alle";
        }
    },
    {
        id: 4,
        name: "Punkte",
        icon: "stopwatch",
        sort: function (a, b) {
            return b.score - a.score;
        },
        getGroupName: function (a) {
            return "Alle";
        }
    },
    {
        id: 5,
        name: "Alter",
        icon: "today",
        sort: function (a, b) {
            return b.ageGroup - a.ageGroup;
        },
        getGroupName: function (a) {
            return a.ageGroup.toString();
        }
    },
    {
        id: 6,
        name: "Gruppe",
        icon: "persons",
        sort: function (a, b) {
            return a.group.localeCompare(b.group);
        },
        getGroupName: function (a) {
            return a.group;
        }
    },
    {
        id: 7,
        name: "Geschlecht",
        icon: "heart",
        sort: function (a, b) {
            return b.isMale - a.isMale;
        },
        getGroupName: function (a) {
            return a.isMale ? "Männlich" : "Weiblich";
        }
    }
];

const sortingSettings = new ReactiveVar([0, 1, 2, 3, 4, 5, 6, 7]);

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


function statusToNumber(athlete) {
    if (isReady(athlete)) return 0;
    if (isUpdate(athlete)) return 1;
    if (isNotReady(athlete)) return 2;
    if (isFinish(athlete)) return 3;
}

function isReady(athlete) {
    return athlete.valid && !athlete.certificateWritten && !athlete.certificateUpdate;
}

function isNotReady(athlete) {
    return !athlete.valid;
}

function isUpdate(athlete) {
    return athlete.valid && athlete.certificateUpdate;
}

function isFinish(athlete) {
    return athlete.valid && athlete.certificateWritten && !athlete.certificateUpdate;
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
    sortingSettings: function () {
        return sortingSettings.get();
    },
    baseSortingSettings: function () {
        return baseSortingData;
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
        const allAthletes = _.map(reactiveAthletes.get(), function (athlete) {
            athlete.typeID = 0;
            return athlete;
        });

        const groups = groupSettings.get();
        const gender = genderSettings.get();
        const status = statusSettings.get();
        const sorting = sortingSettings.get();

        //filter
        const athletes = _.filter(allAthletes, function (athlete) {
            return (gender.m || !athlete.isMale) && (gender.w || athlete.isMale) &&
                (status.ready || !isReady(athlete)) &&
                (status.notReady || !isNotReady(athlete)) &&
                (status.finish || !isFinish(athlete)) &&
                (status.update || !isUpdate(athlete)) &&
                groups[athlete.group];
        });

        //sorting
        const athletesSorted = athletes.sort(function (a, b) {
            let currentIndex = 0;
            let lastComparison = 0;
            while (lastComparison == 0 && currentIndex < baseSortingData.length) {
                lastComparison = baseSortingData[sorting[currentIndex]].sort(a, b);
                currentIndex += 1;
            }
            return lastComparison;
        });


        //grouping
        let result = [];
        let currentGroup = undefined;

        _.forEach(athletesSorted, function (athlete) {

            const groupName = baseSortingData[sorting[0]].getGroupName(athlete);
            if (!currentGroup || groupName != currentGroup.title) {
                if (currentGroup) result.push(currentGroup);
                currentGroup = {title: groupName, athletes: []};
            }
            currentGroup.athletes.push(athlete);
        });
        result.push(currentGroup); //final push

        return result;
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
            if (cTrue == 0) data.text = "Keine";
            else if (cTrue == 1) {
                if (data.ready) data.text = "Bereit";
                else if (data.update) data.text = "Neu Erstellen";
                else if (data.notReady) data.text = "Nicht Bereit";
                else data.text = "Fertig";
            }
            else if (cTrue == Object.keys(data).length - 1) data.text = "Alle";
            else data.text = "Mehrere";
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
    },
    'sort #sortOrderSorter': function (event) {
        const newOrder = _.map(document.getElementById("sortOrderSorter").getElementsByClassName("item-content"), function (obj) {
            return obj.dataset.id;
        });
        sortingSettings.set(newOrder);
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