/**
 * Created by noah on 12/29/16.
 */
import {getCompetitionTypeByID} from "../../../api/logic/competition_type";

/**
 * Object containing all information and functions required for creating a new competition.
 * @public
 * @namespace
 */
export let NewCompetition = {
    /** @constant {number} */
    prefix: "new_competition_",

    /**
     * Sets all default values for the configuration
     */
    setDefaults: function () {
        Session.setDefault(NewCompetition.prefix + "name", "Unbenannt");
        Session.setDefault(NewCompetition.prefix + "competition_type", "0");

        const ct = getCompetitionTypeByID(NewCompetition.getCompetitionTypeID());
        Session.setDefault(
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
        return Session.get(NewCompetition.prefix + "name");
    },

    /**
     * Sets the competition type id of the new competition.
     * @param {number} id - The new CompetitionTypeID.
     */
    setCompetitionTypeID: function (id) {
        Session.set(NewCompetition.prefix + "competition_type", id.toString());
    },

    /**
     * Returns the competition type id of the new competition.
     * @returns {number}
     */
    getCompetitionTypeID: function () {
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
     * Sets the name of the new competition.
     * @param {{stID: string, activated: boolean}[]} sports - The new name.
     */
    setSports: function (sports) {
        Session.set(NewCompetition.prefix + "sport_types", JSON.stringify(sports));
    },

    /**
     * Returns the name of the new competition.
     * @returns {{stID: string, activated: boolean}[]}
     */
    getSports: function () {
        console.log("getSPorts");
        console.log(Session.get(NewCompetition.prefix + "sport_types"));
        return JSON.parse(Session.get(NewCompetition.prefix + "sport_types"));
    }
};