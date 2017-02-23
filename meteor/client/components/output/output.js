import {Template} from "meteor/templating";
import "./output.html";
import "../../styles/resultCollapse.css";
import {Server} from "../../../imports/api/database/ServerInterface";
import {AccountManager} from "../../../imports/api/accountManagement/AccountManager";
import {updateSwiperProgress} from "../login/router";
import {ReactiveVar} from "meteor/reactive-var";
import {findIndexOfAthlete, isReady, isUpdate, isNotReady, isFinish, statusToNumber, countTrue} from "./helpers";
import {showIndicator, hideIndicator} from "../helpers";

Meteor.reactiveAthletes = new ReactiveVar([]);
const groupSettings = new ReactiveVar({text: "Keine"});
const genderSettings = new ReactiveVar({m: true, w: true, text: "Alle"});
const statusSettings = new ReactiveVar({ready: true, update: true, notReady: false, finish: false, text: "Mehrere"});

const baseSortingData = require('./baseSortingData');
const sortingSettings = new ReactiveVar([0, 1, 2, 3, 4, 5, 6, 7]);
let asyncUUID = undefined;

async function loadAllAthlets() {
    Meteor.reactiveAthletes.set([]);
    updatedGroups();

    if (asyncUUID) Server.cancelAsyncRequest(asyncUUID);

    const athletes = [];

    asyncUUID = await Server.certificates.getAsync(
        AccountManager.getOutputAccount().account,
        _.map(Meteor.COLLECTIONS.Athletes.handle.find({}).fetch(), function (enc_athlete) {
            return enc_athlete._id
        }),
        function (athlete, last, entry) {
            if (entry.index == 0)
                hideIndicator();
            if (!athlete) {
                Meteor.f7.alert("Es ist ein Fehler beim Laden der Athleten aufgetreten!", "Fehler");
                return;
            }
            athlete.iconID = statusToNumber(athlete);

            athlete.certificateName = athlete.certificate === 2 ? "Ehrenurkunde" : (athlete.certificate === 1 ? "Siegerurkunde" : (athlete.certificate === 0 ? "Teilnehmerurkunde" : "Fehler"));

            athletes.push(athlete);
            Meteor.reactiveAthletes.set(athletes);
            updatedGroups();
        }, function (entry) {
            if (entry.size == 0) hideIndicator();
        }
    );
}

function getGroupsFromAthletes() {
    const groupNames = [];
    const athletes = Meteor.reactiveAthletes.get();

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
    const settingData = {text: groupNames[0], groups: {}};
    _.forEach(groupNames, function (name) {
        settingData.groups[name] = true;
    });
    settingData.text = "Alle";
    groupSettings.set(settingData);
}

Template.outputFilterPopover.helpers({
    genderSettings: function () {
        return genderSettings.get();
    },
    statusSettings: function () {
        return statusSettings.get();
    },
    groupSettingsText: function () {
        return groupSettings.get().text;
    },
    groupChecked: function (name) {
        return groupSettings.get().groups[name] ? "checked" : "";
    },
    checked: function (b) {
        return b ? "checked" : "";
    },
    groupNames: function () {
        return getGroupsFromAthletes();
    }
});

Template.outputSortingPopover.helpers({
    baseSortingSettings: function () {
        return baseSortingData;
    }
});

//noinspection JSUnusedGlobalSymbols
Template.output.helpers({
    allAthletes: function () {
        return Meteor.reactiveAthletes.get();
    }
});

Template.outputContent.helpers({
    showTitle: function (title) {
        return title !== "";
    },
    uiElements: function () {
        const allAthletes = _.map(Meteor.reactiveAthletes.get(), function (athlete) {
            if (!athlete.classes) {
                athlete.classes = "";
            }
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
                groups.groups[athlete.group];
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
                currentGroup = {title: groupName, athletes: [], show: false};
            }
            if (!athlete.hide) {
                currentGroup.show = true;
            }
            currentGroup.athletes.push(athlete);
        });
        result.push(currentGroup); //final push

        return result;
    }
});

Template.outputContent.events({
    'accordion:open': function (event) {
        let id = event.target.dataset.athlete_id;
        const athletes = Meteor.reactiveAthletes.get();
        for (let i in athletes) {
            if (!athletes.hasOwnProperty(i)) continue;
            if (athletes[i].id == id) {
                athletes[i].manual = true;
                break;
            }
        }
        Meteor.reactiveAthletes.set(athletes);
    },
    'accordion:close': function (event) {
        let id = event.target.dataset.athlete_id;
        const athletes = Meteor.reactiveAthletes.get();
        for (let i in athletes) {
            if (!athletes.hasOwnProperty(i)) continue;
            if (athletes[i].id == id) {
                athletes[i].manual = false;
                break;
            }
        }
        Meteor.reactiveAthletes.set(athletes);
    }
});

Template.output.events({
    'click .logout-button': function (event) {
        Meteor.f7.confirm("Möchten Sie sich wirklich abmelden?", "Abmelden", function () {
            AccountManager.logout("Urkunden");
            sessionStorage.removeItem("firstLogin");
            FlowRouter.go('/login');
            updateSwiperProgress(0);
            return false;
        });
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
            data.groups[event.target.dataset.attr] = !data.groups[event.target.dataset.attr];
            const cTrue = countTrue(data.groups);
            if (cTrue == 0) data.text = "Keine";
            else if (cTrue == 1) {
                for (let a in data.groups) {
                    if (!data.groups.hasOwnProperty(a)) continue;
                    if (data.groups[a] == true) { //== true required because list[a] might be an object
                        data.text = a;
                        break;
                    }
                }
            }
            else if (cTrue == Object.keys(data.groups).length) data.text = "Alle";
            else data.text = "Mehrere";
            groupSettings.set(data);
        }
    },
    'sort #sortOrderSorter': function (event) {
        const newOrder = _.map(document.getElementById("sortOrderSorter").getElementsByClassName("item-content"), function (obj) {
            return obj.dataset.id;
        });
        sortingSettings.set(newOrder);
    },
    'click .sorting-reset-button': function (event) {
        location.reload();
        sortingSettings.set([0, 1, 2, 3, 4, 5, 6, 7]);
    }
});


function replaceAthletes(index) {
    const athletes = Meteor.reactiveAthletes.get();
    const newAthlete = athletes[index].newAthlete;
    newAthlete.iconID = statusToNumber(newAthlete);
    athletes[index].id = "_old_";
    athletes[index].hide = true;
    athletes[index].animation = false;
    athletes.push(newAthlete);
    Meteor.reactiveAthletes.set(athletes);
}

Template.output.onRendered(function () {
    Meteor.f7.sortableOpen('.sortable');
    showIndicator();

    Server.db.waitForReady(function () {
        if (!Meteor.COLLECTIONS.Athletes.changeDetector) {
            Meteor.COLLECTIONS.Athletes.changeDetector = true;
            Meteor.COLLECTIONS.Athletes.handle.find().observeChanges({
                changed: function (id, fields) {
                    if (!AccountManager.getOutputAccount().logged_in) return;

                    //search for changes in data
                    let dataChanged = false;
                    for (let name in fields) {
                        if (!fields.hasOwnProperty(name)) continue;
                        if (name.substr(0, 2) === "m_") {
                            dataChanged = true;
                        }
                    }

                    //show message about new data
                    if (dataChanged) {
                        Meteor.f7.addNotification({
                            title: "Neue Daten",
                            message: "Es wurden neue Daten eingetragen!",
                            hold: 2000,
                            closeOnClick: true,
                        });
                    }

                    //change of certificate information -> update
                    if (fields.hasOwnProperty("certificateScore") || fields.hasOwnProperty("certificate")) {
                        Server.certificates.getAsync(
                            AccountManager.getOutputAccount().account, [id],

                            function (athlete, last, entry) {
                                if (!athlete) {
                                    Meteor.f7.alert("Es ist ein Fehler beim Laden der Athleten aufgetreten!", "Fehler");
                                    return;
                                }
                                //load athletes
                                const athletes = Meteor.reactiveAthletes.get();
                                const index = findIndexOfAthlete(athletes, id);

                                //update current data
                                athletes[index].newAthlete = athlete;

                                //an animation is already running -> return
                                if (athletes[index].animation) {
                                    Meteor.reactiveAthletes.set(athletes);
                                    return;
                                }

                                //start the animation
                                athletes[index].animation = true;
                                athletes[index].iconID = 4;
                                Meteor.reactiveAthletes.set(athletes);

                                //load group names
                                const sorting = sortingSettings.get();
                                const newGroupName = baseSortingData[sorting[0]].getGroupName(athletes[index].newAthlete);
                                const oldGroupName = baseSortingData[sorting[0]].getGroupName(athletes[index]);

                                //waiting for indicator
                                setTimeout(function () {

                                    //update icon
                                    const athletes = Meteor.reactiveAthletes.get();
                                    athletes[index].iconID = statusToNumber(athletes[index].newAthlete);
                                    Meteor.reactiveAthletes.set(athletes);

                                    //waiting for icon
                                    setTimeout(function () {

                                        //TODO check index
                                        if (newGroupName === oldGroupName) {
                                            //group not changed -> no animations required
                                            replaceAthletes(index);
                                        } else {
                                            ///group changed -> start collapsing animation
                                            const athletes = Meteor.reactiveAthletes.get();
                                            athletes[index].classes = "collapsed";
                                            Meteor.reactiveAthletes.set(athletes);

                                            //waiting for collapsing
                                            setTimeout(function () {
                                                replaceAthletes(index);
                                            }, 1000);
                                        }
                                    }, 1000);
                                }, 100);
                            }, function (entry) {
                            }
                        );
                    }
                }
            });
        }
        loadAllAthlets();
    });


});