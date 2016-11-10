/**
 * Created by noah on 08/11/2016.
 */

import {Data} from "./data";

export {Athlete};

/**
 * Creates a new Athlete with the given information.
 * @param first_name
 * @param last_name
 * @param age_group
 * @param is_male
 * @param group
 * @param handicap
 * @constructor
 */
function Athlete(first_name, last_name, age_group, is_male, group, handicap) {
    this.first_name = first_name;
    this.last_name = last_name;
    this.age_group = age_group;
    this.is_male = is_male;
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
        return 1 * (typeof(this.first_name) != 'string') +
            2 * (this.first_name === "") +
            4 * (typeof(this.last_name) != 'string') +
            8 * (this.last_name === "") +
            16 * (typeof(this.age_group) != 'number') +
            32 * (this.age_group <= 1900) +
            64 * (typeof(this.is_male) != 'boolean');
    },
    /**
     * Returns the full name (first name & last name) of the athlete.
     * @returns {string}
     */
    getFullName: function () {
        return this.first_name + ' ' + this.last_name;
    },
    /**
     * Returns a short version of the athletes name (first name & last initial).
     * @returns {string}
     */
    getShortName: function () {
        return this.first_name + ' ' + this.last_name[0] + '.';
    },
    /**
     * Returns the age of the athlete. This might not be the correct age but for the BJS only the year of birth is important.
     * @returns {number}
     */
    get age() {
        return new Date().getFullYear() - this.age_group;
    },
    /**
     * Sets the age of the athlete.
     * @param new_age
     */
    set age(new_age) {
        this.age_group = new Date().getFullYear() - new_age;
    }
};