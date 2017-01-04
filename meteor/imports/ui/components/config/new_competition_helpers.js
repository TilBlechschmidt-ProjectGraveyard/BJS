/**
 * Created by noah on 12/29/16.
 */
import {getCompetitionTypeByID} from "../../../api/logic/competition_type";
import {Account} from "../../../api/logic/account";
import {Log} from "../../../api/log";
import {Athlete} from "../../../api/logic/athlete";
import {DBInterface} from "../../../api/database/db_access";
import {Crypto} from "../../../api/crypto/crypto";

//TODO include
// if (!Meteor.oldName) {
//     if (window.location.href.includes("/config/")) {
//         FlowRouter.redirect('/config');
//     }
// }

const start_classes_object = require('../../../data/start_classes.json');

let start_classes = [];

for (let stID in start_classes_object) {
    //noinspection JSUnresolvedFunction
    if (!start_classes_object.hasOwnProperty(stID)) continue;
    start_classes.push({
        stID: stID,
        name: start_classes_object[stID].name
    });
}


export function nameExists(name) {
    // remove whitespaces
    const name_without_whitespaces = name.replace(/ /g, '');

    // get all competitions
    const allCompetitions = _.map(DBInterface.listCompetitions().concat(DBInterface.listEditCompetitions()), function (n) {
        return n.replace(/ /g, '');
    });
    return allCompetitions.indexOf(name_without_whitespaces) != -1 && name_without_whitespaces != NewCompetition.getName();
}

/**
 * Object containing all information and functions required for creating a new competition.
 * @public
 * @namespace
 */
export let NewCompetition = {
    editModeAccount: new Account('EditModeAccount', [''], [], Crypto.generateAC('1234', '1234')),

    start_classes: start_classes,

    /** @constant {number} */
    prefix: "new_competition_",


    /**
     * Saves the current configuration
     * @param {Account[]} [accounts] - All generated accounts. undefined will save the competition editable
     * @param [callback] optional callback
     */
    save: function (accounts, callback) {
        const log = new Log();
        const ct = NewCompetition.getCompetitionType();

        //load all sport types
        const sportTypes = _.map(_.filter(NewCompetition.getSports(), function (obj) {
            return obj.activated;
        }), function (obj) {
            return obj.stID;
        });

        // undefined -> false
        const final = !!accounts;

        if (!final) {
            accounts = [NewCompetition.editModeAccount];
            if (Meteor.loginGroups.length > 0 || Meteor.loginStations.length > 0 || Meteor.loginCustom.length > 0) {
                Meteor.f7.alert("Die Accounts werden erst gespeichert, wenn der Wettkampf gestartet wird.", "Hinweis");
            }
        }

        // athletes

        let encryptedAthletes = [];
        let groupToEncryptedAthletes = function (group) {
            // iterate athletes and encrypt
            return _.map(Meteor.groups[group].athletes, function (athlete) {
                let account = final ? Meteor.groups[group].account : NewCompetition.editModeAccount;

                return new Athlete(
                    log,
                    athlete.firstName,
                    athlete.lastName,
                    athlete.ageGroup,
                    athlete.isMale,
                    Meteor.groups[group].name,
                    athlete.handicap,
                    ct.maxAge,
                    ct,
                    sportTypes
                ).encryptForDatabase(account, account);
            });
        };

        // iterate groups and save encrypted athletes
        for (let group in Meteor.groups) {
            if (!Meteor.groups.hasOwnProperty(group)) continue;
            encryptedAthletes = encryptedAthletes.concat(groupToEncryptedAthletes(group));
        }

        //remove old competition if name changed
        if (Meteor.oldName != NewCompetition.getName()) {
            DBInterface.removeCompetition(Meteor.adminAccount, Meteor.oldName);
            Meteor.oldName = NewCompetition.getName();
        }

        //save the new competition
        DBInterface.writeCompetition(
            Meteor.adminAccount,
            NewCompetition.getName(),
            NewCompetition.getCompetitionTypeID(),
            sportTypes,
            encryptedAthletes,
            accounts,
            final,
            function (result) {
                //check result
                if (!result) {
                    Meteor.f7.alert("Es gab einen Fehler während des Speicherns. Melden Sie sich ab und versuchen Sie es bitte erneut.");
                    if (typeof callback === 'function') callback(false);
                }
                if (typeof callback === 'function') callback(true);
            }
        );
    },

    groupExists: function (name) {
        //iterate groups
        for (let group in Meteor.groups) {
            if (!Meteor.groups.hasOwnProperty(group)) continue;
            //check name
            if (Meteor.groups[group].name === name) return true;
        }
        return false;
    },

    selectAthlete: function (athleteID) {
        if (!document.getElementById("in-first-name")) {
            //ui elements aren't ready. just select nothing
            Meteor._currentAthlete = -1;
        } else {
            if ((Meteor._currentAthlete != -1) && (Meteor._currentGroup != -1)) {
                //another athlete is selected -> save all changes
                let old_athlete = Meteor.groups[Meteor._currentGroup].athletes[Meteor._currentAthlete];
                old_athlete.firstName = document.getElementById("in-first-name").value;
                old_athlete.lastName = document.getElementById("in-last-name").value;
                old_athlete.ageGroup = document.getElementById("in-year").value;
                old_athlete.isMale = document.getElementById("pick-gender").selectedIndex === 0;
                const handicapID = document.getElementById("pick-start_class").selectedIndex;
                old_athlete.handicap = NewCompetition.start_classes[handicapID].stID;
            }
            Meteor._currentAthlete = athleteID;
            if (athleteID != -1) {
                // the new selected is an athlete -> load data & activate ui elements
                const new_athlete = Meteor.groups[Meteor._currentGroup].athletes[Meteor._currentAthlete];

                //activate
                document.getElementById("in-first-name").removeAttribute("disabled");
                document.getElementById("in-last-name").removeAttribute("disabled");
                document.getElementById("in-year").removeAttribute("disabled");
                document.getElementById("pick-gender").removeAttribute("disabled");
                document.getElementById("pick-start_class").removeAttribute("disabled");
                document.getElementById("btn-delete-athlete").removeAttribute("disabled");
                document.getElementById("btn-add-athlete2").removeAttribute("disabled");

                document.getElementById("pick-gender").selectedIndex = 1 - new_athlete.isMale;

                // find the start class index
                for (let id in start_classes) {
                    if (start_classes[id].stID === new_athlete.handicap) {
                        document.getElementById("pick-start_class").selectedIndex = id;
                        break;
                    }
                }

                //set content of text fields
                document.getElementById("in-first-name").value = new_athlete.firstName;
                document.getElementById("in-last-name").value = new_athlete.lastName;
                document.getElementById("in-year").value = new_athlete.ageGroup;

                // call it a second time because some browsers have problems with the placeholder
                document.getElementById("in-first-name").value = new_athlete.firstName;
                document.getElementById("in-last-name").value = new_athlete.lastName;
                document.getElementById("in-year").value = new_athlete.ageGroup;
            } else {
                // the new selected isn't an athlete -> deactivate ui elements
                document.getElementById("in-first-name").setAttribute("value", "");
                document.getElementById("in-last-name").setAttribute("value", "");
                document.getElementById("in-year").setAttribute("value", "");

                document.getElementById("in-first-name").setAttribute("disabled", "true");
                document.getElementById("in-last-name").setAttribute("disabled", "true");
                document.getElementById("in-year").setAttribute("disabled", "true");
                document.getElementById("pick-gender").setAttribute("disabled", "true");
                document.getElementById("btn-delete-athlete").setAttribute("disabled", "true");
                document.getElementById("btn-add-athlete2").setAttribute("disabled", "true");
                document.getElementById("pick-start_class").setAttribute("disabled", "true");

                document.getElementById("pick-gender").selectedIndex = 0;
                document.getElementById("pick-start_class").selectedIndex = 0;

                document.getElementById("in-first-name").value = "";
                document.getElementById("in-last-name").value = "";
                document.getElementById("in-year").value = "";
                // call it a second time because some browsers have problems with the placeholder
                document.getElementById("in-first-name").value = "";
                document.getElementById("in-last-name").value = "";
                document.getElementById("in-year").value = "";
            }
        }
        Meteor._athletes_tracker.changed();
    },

    /**
     * Resets sport types.
     */
    resetSportTypes: function () {
        const ct = getCompetitionTypeByID(NewCompetition.getCompetitionTypeID());
        Session.set(
            NewCompetition.prefix + "sport_types",
            JSON.stringify(_.map(ct.getSports(), function (sportObj) {
                return {stID: sportObj.id, activated: true};
            }))
        );
    },

    /**
     * Sets the name of the new competition.
     * @param {string} name - The new name.
     */
    setName: function (name) {
        Session.set(NewCompetition.prefix + "name", name);
    },

    /**
     * Returns the name of the new competition.
     * @returns {string}
     */
    getName: function () {
        Session.setDefault(NewCompetition.prefix + "name", "Unbenannt");//TODO find unused
        return Session.get(NewCompetition.prefix + "name");
    },

    /**
     * Sets the competition type id of the new competition.
     * @param {number} id - The new CompetitionTypeID.
     */
    setCompetitionTypeID: function (id) {
        Session.set(NewCompetition.prefix + "competition_type", id.toString());
        NewCompetition.resetSportTypes();
    },

    /**
     * Returns the competition type id of the new competition.
     * @returns {number}
     */
    getCompetitionTypeID: function () {
        Session.setDefault(NewCompetition.prefix + "competition_type", "0");
        return parseInt(Session.get(NewCompetition.prefix + "competition_type"));
    },

    /**
     * Returns the competition type of the new competition.
     * @returns {object}
     */
    getCompetitionType: function () {
        return getCompetitionTypeByID(NewCompetition.getCompetitionTypeID());
    },

    /**
     * @typedef {Object} NewCompetitionSportTypes
     * @property {string} stID - The sport type id.
     * @property {boolean} activated - Sport type is activated or not.
     */

    /**
     * Sets the sport types of the new competition.
     * @param {NewCompetitionSportTypes[]} sports - The new name.
     */
    setSports: function (sports) {
        Session.set(NewCompetition.prefix + "sport_types", JSON.stringify(sports));
    },

    /**
     * Returns the sport types of the new competition.
     * @returns {NewCompetitionSportTypes[]}
     */
    getSports: function () {
        const ct = getCompetitionTypeByID(NewCompetition.getCompetitionTypeID());
        Session.setDefault(
            NewCompetition.prefix + "sport_types",
            //iterate all activated sports
            JSON.stringify(_.map(ct.getSports(), function (sportObj) {
                return {stID: sportObj.id, activated: true};
            }))
        );
        return JSON.parse(Session.get(NewCompetition.prefix + "sport_types"));
    },

    /**
     * @typedef {Object} ConfigAthlete
     * @property {string} firstName first-name of the athlete
     * @property {string} lastName last-name of the athlete
     * @property {number} ageGroup Age category of the athlete
     * @property {boolean} isMale Whether or not the athlete is male
     * @property {string} handicap Handicap id of the athlete
     */

    /**
     * @typedef {Object} AthleteGroup
     * @property {string} name - The groups name.
     * @property {ConfigAthlete[]} athletes - List of all athletes. It's not a normal athlete but a ConfigAthlete.
     */

    /**
     * Sets the groups of athletes of the new competition.
     * @param {AthleteGroup[]} groups - The new groups.
     */
    setGroups: function (groups) {
        Session.set(NewCompetition.prefix + "groups", JSON.stringify(groups));
        Meteor.groups = groups;
    },

    /**
     * Returns the groups of athletes of the new competition.
     * @returns {AthleteGroup[]}
     */
    getGroups: function () {
        Session.setDefault(NewCompetition.prefix + "groups", JSON.stringify([]));
        return JSON.parse(Session.get(NewCompetition.prefix + "groups"));
    }
};

Meteor.groups = NewCompetition.getGroups();