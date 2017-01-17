import {editMode} from "../config";
import gender from "gender-guess";
import {filterUndefined} from "../../../../imports/api/logic/general";
import {
    localGroups,
    athleteErrorState,
    selectedAthlete,
    modifyAthlete,
    addAthlete,
    removeAthlete,
    addGroup,
    renameGroup,
    removeGroup,
    modifyGroup,
    refreshErrorState
} from "./dataInterface";

const startClasses = require('../../../../imports/data/startClasses.json');

const nameFilter = new ReactiveVar([]);
const groupsIsNotEmpty = new ReactiveVar(true);

Template.athleteList.helpers({
    groups: function () {
        const nFilter = nameFilter.get();
        const groups = filterUndefined(_.map(localGroups.get(), function (group) {
            const athletes = _.filter(group.athletes, function (athlete) {
                const fullName = athlete.getFullName();
                for (let filter in nFilter) {
                    if (!nFilter.hasOwnProperty(filter)) continue;
                    if (fullName.indexOf(nFilter[filter]) == -1) return false;
                }
                return true;
            });

            if (!editMode.get() && athletes.length == 0) return undefined;


            return {
                name: group.name,
                id: group.id,
                collapsed: group.collapsed,
                errorLevel: group.errorLevel,
                athletes: athletes
            }
        }));
        groupsIsNotEmpty.set(groups.length != 0);
        return groups;
    },
    readOnly: function () {
        return !editMode.get();
    }
});
Template.config_searchBar.helpers({
    groupsIsNotEmpty: function () {
        return groupsIsNotEmpty.get();
    }
});

Template.group.helpers({
    validAthlete: function (athlete) {
        if (editMode.get())
            return athlete.check(Meteor.config.log);
        else
            return true;
    },
    tooltipLevel: function (obj) {
        const errorState = athleteErrorState.get()[obj.id];
        return errorState ? errorState.level : undefined;
    },
    tooltipMsg: function (obj) {
        const errorState = athleteErrorState.get()[obj.id];
        return errorState ? errorState.message : undefined;
    },
    startClassName: function (startClass) {
        return startClasses[startClass].name;
    }
});

Template.group.events({
    'keyup .ageGroup': function (event) {
        event.stopImmediatePropagation();
        const id = event.target.closest("li").dataset.id;
        modifyAthlete(id, function (athlete) {
            athlete.ageGroup = parseInt(event.target.value);
        });
    },
    'mousewheel .ageGroup': function (event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        const e = event.originalEvent;
        const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        const id = event.target.closest("li").dataset.id;
        modifyAthlete(id, function (athlete) {
            athlete.ageGroup = athlete.ageGroup + delta;
        });
        return false;
    },
    'click .gender': function (event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        const id = event.target.closest("li").dataset.id;
        const isMale = lodash.includes(event.target.className, 'gender-male');
        modifyAthlete(id, function (athlete) {
            athlete.isMale = isMale;
        });
        return false;
    },
    'click .startClassSelectOpen': function (event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        const id = event.target.closest("li").dataset.id;
        modifyAthlete(id, function (athlete) { //Abuse the function to get the athlete data
            selectedAthlete.set(athlete);
        });
        Meteor.f7.popup(".popup-startclass");
        return false;
    },
    'blur input.name-input': function (event) {
        const id = event.target.closest("li").dataset.id;
        const name = event.target.value;
        const firstName = name.split(' ').slice(0, -1).join(' ').trim();
        const lastName = name.split(' ').slice(-1).join(' ').trim();
        modifyAthlete(id, function (athlete) {
            if (athlete.isMale === undefined) {
                const genderGuess = gender.guess(firstName);
                if (genderGuess !== undefined && typeof genderGuess.gender === 'string' && genderGuess.confidence > 0.96) athlete.isMale = genderGuess.gender == "M";
            }
            athlete.firstName = firstName;
            athlete.lastName = lastName;
        });
    },
    'keyup input.name-input': function (event) {
        const id = event.target.closest("li").dataset.id;
        const name = event.target.value;
        const firstName = name.split(' ').slice(0, -1).join(' ').trim();
        const lastName = name.split(' ').slice(-1).join(' ').trim();
        refreshErrorState(id, firstName, lastName);
    },
    'click input': function (event) {
        if (editMode.get()) {
            event.stopImmediatePropagation();
            event.preventDefault();
            event.target.focus();
            return false;
        }
    },
    'click .add-athlete': function (event) {
        const gid = event.target.closest(".add-athlete").dataset.id;
        addAthlete(gid);
    },
    'click .remove-athlete': function (event) {
        event.stopImmediatePropagation();
        const id = event.target.closest("li").dataset.id;
        Meteor.f7.confirm('Wollen sie den Athleten wirklich endgültig löschen?', 'Athleten löschen', function () {
            removeAthlete(id);
        });
    },
    'click .add-group': function (event) {
        Meteor.f7.prompt('Wähle einen Namen für die Gruppe', 'Gruppe erstellen', function (value) {
            addGroup(value);
        }).querySelector("input").focus();
    },
    'click .rename-group': function (event) {
        const gid = event.target.closest("[data-gid]").dataset.gid;
        Meteor.f7.prompt('Wähle einen neuen Namen für die Gruppe', 'Gruppe umbenennen', function (newName) {
            renameGroup(gid, newName);
        }).querySelector("input").focus();
    },
    'click .remove-group': function (event) {
        const gid = event.target.closest("[data-gid]").dataset.gid;
        Meteor.f7.confirm('Wollen sie die Gruppe samt ihrer Athleten endgültig löschen?', 'Gruppe löschen', function () {
            removeGroup(gid);
        });
    },
    'click .collapse-group': function (event) {
        event.stopImmediatePropagation();
        const gid = event.target.closest("[data-gid]").dataset.gid || event.target.closest("li").dataset.gid;
        modifyGroup(gid, function (group) {
            if (!group.collapsed) {
                // Collapse accordions
                const accordion = document.querySelector("#athlete-list-" + gid + " li.accordion-item-expanded");
                if (accordion)
                    Meteor.f7.accordionClose(accordion);
            }
            group.collapsed = !group.collapsed;
        });
        const spans = $(".groupTitle-" + gid + " span");
        spans.fadeToggle(300);
    }
});

Template.config_searchBar.events({
    'keyup #configAthletesSearch': function (event) {
        nameFilter.set(event.target.value.split(' '));
    }
});