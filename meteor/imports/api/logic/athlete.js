/**
 * Created by noah on 08/11/2016.
 */
import {Data} from "./data";
import {encrypt, tryDecrypt} from "./../crypto/crypto.js";


/**
 * Creates a new Athlete with the given information.
 * @param log
 * @param firstName
 * @param lastName
 * @param ageGroup
 * @param isMale
 * @param group
 * @param handicap
 * @param maxAge
 * @param ct
 * @constructor
 */
export function Athlete(log, firstName, lastName, ageGroup, isMale, group, handicap, maxAge, ct) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.ageGroup = ageGroup;
    this.isMale = isMale;
    this.group = group;
    this.handicap = handicap;
    this.maxAge = maxAge;
    /// data is an array of objects with id (view getSports) and measurement
    // example: [{id: 'st_sprint', measurement: 16}]

    if (ct.constructor == Array) {
        this.sports = ct;
    } else {
        this.sports = [];

        const allSports = ct.getSports();
        for (let sport in allSports) {
            if (ct.canDoSportType(log, this, allSports[sport].id).canDoSport) {
                this.sports.push(allSports[sport].id);
            }
        }
    }

    this.data = new Data();
}

Athlete.prototype = {
    /**
     * Returns the data in plain text.
     * @param log
     * @param {object[]} accounts
     * @param requireSignature
     * @returns {{stID, measurements}[]}
     */
    getPlain: function (log, accounts, requireSignature) {
        return this.data.getPlain(log, accounts, requireSignature, this.group);
    },


    /**
     * Updates the data of a given stID.
     * @param log
     * @param {string} stID                the sport type of the data
     * @param {number[]} newMeasurements      the new data
     * @param groupAccount
     * @param stationAccount
     * @returns {boolean}
     */
    update: function (log, stID, newMeasurements, groupAccount, stationAccount) {

        let canWrite = true;

        if (groupAccount.group_permissions.indexOf(this.group) == -1) {
            log.error('Der Gruppen Account hat keine Berechtigung');
            canWrite = false;
        }

        if (stationAccount.score_write_permissions.indexOf(stID) == -1) {
            log.error('Der Stations Account hat keine Berechtigung');
            canWrite = false;
        }


        if (canWrite) {
            this.data.update(log, stID, newMeasurements, groupAccount.ac, stationAccount.ac);
            return true;
        } else {
            return false;
        }
    },

    /**
     * Checks whether the properties of the athlete are correct.
     * @returns {boolean}
     */
    check: function (log) {
        let result = true;

        if ((typeof(this.firstName) != 'string') || (this.firstName === '')) {
            log.error('Der Vorname des Athleten ist ungültig.');
            result = false;
        }
        if ((typeof(this.lastName) != 'string') || (this.lastName === '')) {
            log.error('Der Nachname des Athleten ist ungültig.');
            result = false;
        }
        if (typeof(this.ageGroup) != 'number') {
            log.error('Der Jahrgang des Athleten ist ungültig.');
            result = false;
        } else if (this.age < 8) {
            log.error('Der Sportler ist zu jung um an den Bundesjugendspielen teilzunehmen.');
            result = false;
        }
        if (typeof(this.isMale) != 'boolean') {
            log.error('Das Geschlecht des Athleten ist ungültig');
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
    },

    /**
     * Encrypts the athlete for the database
     * @param groupAC
     * @returns {*}
     */
    encryptForDatabase: function (groupAC) {
        const encrypted = {};

        encrypted.firstName = encrypt(this.firstName, groupAC, groupAC);
        encrypted.lastName = encrypt(this.lastName, groupAC, groupAC);
        encrypted.ageGroup = encrypt(this.ageGroup, groupAC, groupAC);
        encrypted.isMale = encrypt(this.isMale, groupAC, groupAC);
        encrypted.group = encrypt(this.group, groupAC, groupAC);
        encrypted.handicap = encrypt(this.handicap, groupAC, groupAC);
        encrypted.maxAge = encrypt(this.maxAge, groupAC, groupAC);

        encrypted.sports = encrypt(this.sports, groupAC, groupAC);
        encrypted.data = this.data;

        return encrypted;
    },

    /**
     * Decrypts the data from the database
     * @param log
     * @param data
     * @param acs
     * @returns {*}
     */
    decryptFromDatabase: function (log, data, acs) {
        const firstName = tryDecrypt(log, data.firstName, acs);
        const lastName = tryDecrypt(log, data.lastName, acs);
        const ageGroup = tryDecrypt(log, data.ageGroup, acs);
        const isMale = tryDecrypt(log, data.isMale, acs);
        const group = tryDecrypt(log, data.group, acs);
        const handicap = tryDecrypt(log, data.handicap, acs);
        const maxAge = tryDecrypt(log, data.maxAge, acs);
        const sports = tryDecrypt(log, data.sports, acs);

        if (firstName && lastName && ageGroup && isMale && group && handicap && maxAge && sports) {
            return new Athlete(log, firstName.data, lastName.data, ageGroup.data, isMale.data, group.data, handicap.data, maxAge.data, sports.data);
        }
        log.error('Cannot decrypt data');
        return false;
    }
};