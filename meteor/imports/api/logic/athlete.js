/**
 * Created by noah on 08/11/2016.
 */

import {Data} from "./data";


/**
 * Creates a new Athlete with the given information.
 * @param first_name
 * @param lastName
 * @param ageGroup
 * @param is_male
 * @param group
 * @param handicap
 * @constructor
 */
export function Athlete(firstName, lastName, ageGroup, isMale, group, handicap) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.ageGroup = ageGroup;
    this.isMale = isMale;
    this.group = group;
    this.handicap = handicap;
    /// data is an array of objects with id (view getSports) and measurement
    // example: [{id: 'st_sprint', measurement: 16}]
    this.data = new Data();
}

Athlete.prototype = {
    /**
     * Checks whether the properties of the athlete are correct.
     * @returns {number}
     */
    check: function () {
        return 1 * (typeof(this.firstName) != 'string') +
            2 * (this.firstName === "") +
            4 * (typeof(this.lastName) != 'string') +
            8 * (this.lastName === "") +
            16 * (typeof(this.ageGroup) != 'number') +
            32 * (this.ageGroup <= 1900) +
            64 * (typeof(this.isMale) != 'boolean');
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
     * Sets the age of the athlete.
     * @param newAge
     */
    set age(newAge) {
        this.ageGroup = new Date().getFullYear() - newAge;
    }
};