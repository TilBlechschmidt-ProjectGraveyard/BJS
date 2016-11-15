/**
 * Created by noah on 08/11/2016.
 */
import {Data} from "./data";


/**
 * Creates a new Athlete with the given information.
 * @param firstName
 * @param lastName
 * @param ageGroup
 * @param isMale
 * @param group
 * @param handicap
 * @param maxAge
 * @constructor
 */
export function Athlete(firstName, lastName, ageGroup, isMale, group, handicap, maxAge) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.ageGroup = ageGroup;
    this.isMale = isMale;
    this.group = group;
    this.handicap = handicap;
    this.maxAge = maxAge;
    /// data is an array of objects with id (view getSports) and measurement
    // example: [{id: 'st_sprint', measurement: 16}]
    this.data = new Data();
}

Athlete.prototype = {
    /**
     * Checks whether the properties of the athlete are correct.
     * @returns {boolean}
     */
    check: function (log) {
        let result = true;

        if ((typeof(this.firstName) != 'string') || (this.firstName === "")) {
            log.error("Der Vorname des Athleten ist ungültig.");
            result = false;
        }
        if ((typeof(this.lastName) != 'string') || (this.lastName === "")) {
            log.error("Der Nachname des Athleten ist ungültig.");
            result = false;
        }
        if (typeof(this.ageGroup) != 'number') {
            log.error("Der Jahrgang des Athleten ist ungültig.");
            result = false;
        } else if (this.age < 8) {
            log.error("Der Sportler ist zu jung um an den Bundesjugendspielen teilzunehmen.");
            result = false;
        }
        if (typeof(this.isMale) != 'boolean') {
            log.error("Das Geschlecht des Athleten ist ungültig");
            result = false;
        }
        return result;
    },
    /**
     * Returns the full name (first name & last name) of the athlete.
     * @returns {string}
     */
    getFullName: function () {
        return this.firstName + ' ' + this.lastName;
    },
    /**
     * Returns a short version of the athletes name (first name & last initial).
     * @returns {string}
     */
    getShortName: function () {
        return this.firstName + ' ' + this.lastName[0] + '.';
    },
    /**
     * Returns the age of the athlete. This might not be the correct age but for the BJS only the year of birth is important.
     * @returns {number}
     */
    get age() {
        return new Date().getFullYear() - this.ageGroup;
    },
    /**
     * Returns the age of the athlete. This might not be the correct age but for the BJS only the year of birth is important. If the age is greater than 20, 20 is returned.
     * @returns {number}
     */
    get tableAge() {
        return Math.min(new Date().getFullYear() - this.ageGroup, this.maxAge);
    },
    /**
     * Sets the age of the athlete.
     * @param newAge
     */
    set age(newAge) {
        this.ageGroup = new Date().getFullYear() - newAge;
    }
};