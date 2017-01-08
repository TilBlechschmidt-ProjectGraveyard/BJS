import {Template} from "meteor/templating";
import "./output.html";
import "./resultCollapse.css";
import {DBInterface} from "../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../imports/api/account_managment/AccountManager";
import {updateSwiperProgress} from "../login/router";
import {ReactiveVar} from "meteor/reactive-var";
import {findIndexOfAthlete, isReady, isUpdate, isNotReady, isFinish, statusToNumber, countTrue} from "./helpers";

Meteor.reactiveAthletes = new ReactiveVar([]);
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
            return "";
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
            return "";
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
            return "";
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
            Meteor.reactiveAthletes.set(_.map(data, function (athlete) {
                athlete.iconID = statusToNumber(athlete);
                athlete.animateNext = true;
                return athlete;
            }));
            updatedGroups();
            Meteor.f7.hideIndicator();
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
    const settingData = {};
    _.forEach(groupNames, function (name) {
        settingData[name] = false;
    });
    settingData[groupNames[0]] = true;
    settingData.text = groupNames[0];
    groupSettings.set(settingData);
}




//noinspection JSUnusedGlobalSymbols
Template.output.helpers({
    allAthletes: function () {
        return Meteor.reactiveAthletes.get();
    },
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
            athlete.noAnimation = !athlete.animateNext;
            athlete.animateNext = false;
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
    'click .logout-button': function () {
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


function replaceAthletes(index, newAthlete) {
    const athletes = Meteor.reactiveAthletes.get();
    newAthlete.iconID = statusToNumber(newAthlete);
    newAthlete.animateNext = true;
    // newAthlete.classes = "collapsed";
    athletes[index] = newAthlete;
    Meteor.reactiveAthletes.set(athletes);
    // Tracker.afterFlush(function () {
    //     const athletes = Meteor.reactiveAthletes.get();
    //     athletes[index].classes = "";
    //     Meteor.reactiveAthletes.set(athletes);
    // });
}

Template.output.onRendered(function () {
    Meteor.f7.sortableOpen('.sortable');
    Meteor.f7.showIndicator();

    DBInterface.waitForReady(function () {
        if (!Meteor.COLLECTIONS.Athletes.changeDetector) {
            Meteor.COLLECTIONS.Athletes.changeDetector = true;
            Meteor.COLLECTIONS.Athletes.handle.find().observeChanges({
                changed: function (id, fields) {
                    if (!AccountManager.getOutputAccount().logged_in) return;

                    let dataChanged = false;
                    for (let name in fields) {
                        if (!fields.hasOwnProperty(name)) continue;
                        if (name.substr(0, 2) === "m_") {
                            dataChanged = true;
                        }
                    }
                    if (dataChanged) {
                        Meteor.f7.addNotification({
                            title: "Neue Daten",
                            message: "Es wurden neue Daten eingetragen!",
                            hold: 2000,
                            closeOnClick: true,
                        });
                    }

                    DBInterface.generateCertificates(
                        AccountManager.getOutputAccount().account, [id], function (data) {
                            setTimeout(function () {
                                const athlete = data[0];
                                const athletes = Meteor.reactiveAthletes.get();
                                const index = findIndexOfAthlete(athletes, id);
                                athletes[index].iconID = statusToNumber(athlete);
                                athletes[index].animateNext = true;
                                Meteor.reactiveAthletes.set(athletes);

                                setTimeout(function () {
                                    const sorting = sortingSettings.get();

                                    const newGroupName = baseSortingData[sorting[0]].getGroupName(data);
                                    const oldGroupName = baseSortingData[sorting[0]].getGroupName(athletes[index]);

                                    //TODO check index
                                    if (newGroupName === oldGroupName) {
                                        //group not changed -> no animations required
                                        replaceAthletes(index, athlete);
                                    } else {
                                        ///group changed -> start animation
                                        const athletes = Meteor.reactiveAthletes.get();
                                        athletes[index].classes = "collapsed";
                                        Meteor.reactiveAthletes.set(athletes);


                                        // const parent = accordionItem.parentNode;
                                        // if (parent.childElementCount == 1) {
                                        //     parent.parentNode.parentNode.style.maxHeight = "0";
                                        // }
                                        //waiting for collapsing
                                        setTimeout(function () {
                                            replaceAthletes(index, athlete);
                                        }, 1000);
                                    }
                                }, 1000);
                            }, 100);
                        }
                    );
                }
            });
        }
        loadAllAthlets();
    });


});


// Template.layout.animations({
//     ".certificate": {
//         container: ".certificate-list", // container of the ".item" elements
//         insert: {
//             class: "fade-in", // class applied to inserted elements
//             before: function(attrs, element, template) {}, // callback before the insert animation is triggered
//             after: function(attrs, element, template) {}, // callback after an element gets inserted
//             delay: 500 // Delay before inserted items animate
//         },
//         remove: {
//             class: "collapsed", // class applied to removed elements
//             before: function(attrs, element, template) {
//                 console.log("hiding");
//             }, // callback before the remove animation is triggered
//             after: function(attrs, element, template) {
//                 console.log("hidden");
//             }, // callback after an element gets removed
//             delay: 500 // Delay before removed items animate
//         },
//         animateInitial: true, // animate the elements already rendered
//         animateInitialStep: 200, // Step between animations for each initial item
//         animateInitialDelay: 500 // Delay before the initial items animate
//     }
// });