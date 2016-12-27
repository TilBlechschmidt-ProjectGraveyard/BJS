import {Data} from "./data";
import {encrypt, tryDecrypt} from "./../crypto/crypto.js";
import {getAcsFromAccounts} from "./account";


/**
 * @summary Creates a new Athlete with the given information.
 * @param log {Log} Logger instance to use
 * @param firstName {string} first-name of the athlete
 * @param lastName {string} last-name of the athlete
 * @param ageGroup {integer} Age category of the athlete
 * @param isMale {boolean} Whether or not the athlete is male
 * @param group {string} Identifier of the group this athlete is part of
 * @param handicap {integer} Handicap level of the athlete
 * @param maxAge {integer} The max age provided by the competition type (ct.maxAge)
 * @param ct {String[]|object} List of sports the athlete can do or a competition type object
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
     * @typedef {Object} ReturnPlainData
     * @property {string} stID The Station ID
     * @property {number[]} measurements The Measurements
     */

    /**
     * @summary Returns the data in plain text.
     * @param log {Log} Logger instance to use
     * @param accounts {object[]}
     * @param requireSignature
     * @returns {ReturnPlainData[]}
     */
    getPlain: function (log, accounts, requireSignature) {
        return this.data.getPlain(log, accounts, requireSignature, this.group);
    },


    /**
     * @summary Updates the data of a given sport (stID).
     * @param log {Log} Logger instance to use
     * @param stID {string} Identifier of the sport that should get updated/new values
     * @param newMeasurements {number[]} New measurements that should be inserted
     * @param groupAccount {Account} Account of the group this athlete is part of
     * @param stationAccount {Account} Account of the station responsible for this sport type
     * @returns {boolean} A boolean value that describes whether or not the update was successful
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
     * @summary Checks whether the properties of the athlete are correct.
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
     * @summary Returns the full name (first name & last name) of the athlete.
     * @returns {string}
     */
    getFullName: function () {
        return this.firstName + ' ' + this.lastName;
    },
    /**
     * @summary Returns a short version of the athletes name (first name & last initial).
     * @returns {string}
     */
    getShortName: function () {
        return this.firstName + ' ' + this.lastName[0] + '.';
    },
    /**
     * @summary Returns the age of the athlete. This might not be the correct age but for the BJS only the year of birth is important.
     * @returns {number}
     */
    get age() {
        return new Date().getFullYear() - this.ageGroup;
    },
    /**
     * @summary Returns the age of the athlete. This might not be the correct age but for the BJS only the year of birth is important. If the age is greater than the max age of the Competition Type, this age is returned.
     * @returns {number}
     */
    get tableAge() {
        return Math.min(new Date().getFullYear() - this.ageGroup, this.maxAge);
    },
    /**
     * @summary Sets the age of the athlete.
     * @param newAge {integer} New age of the athlete
     */
    set age(newAge) {
        this.ageGroup = new Date().getFullYear() - newAge;
    },

    /**
     * @summary Encrypts the athlete for the database
     * @returns {Object}
     * @param groupAccount {Account} Account of the group that this athlete is part of
     * @param serverAccount {Account} Master account (?) TODO Describe this in a meaningful fashion
     */
    encryptForDatabase: function (groupAccount, serverAccount) {
        const encrypted = {};

        encrypted.firstName = encrypt(this.firstName, groupAccount.ac, serverAccount.ac);
        encrypted.lastName = encrypt(this.lastName, groupAccount.ac, serverAccount.ac);
        encrypted.ageGroup = encrypt(this.ageGroup, groupAccount.ac, serverAccount.ac);
        encrypted.isMale = encrypt(this.isMale, groupAccount.ac, serverAccount.ac);
        encrypted.group = encrypt(this.group, groupAccount.ac, serverAccount.ac);
        encrypted.handicap = encrypt(this.handicap, groupAccount.ac, serverAccount.ac);
        encrypted.maxAge = encrypt(this.maxAge, groupAccount.ac, serverAccount.ac);

        encrypted.sports = encrypt(this.sports, groupAccount.ac, serverAccount.ac);
        encrypted.data = this.data;

        return encrypted;
    }
};

/**
 * @summary Decrypts the data from the database
 * @param log {Log} Logger instance to use
 * @param data {Object} Encrypted athlete
 * @param accounts {Account[]} List of accounts containing the one that was used for encryption
 * @param require_signature {boolean} whether or not to enable signature enforcing
 * @returns {Athlete}
 */
Athlete.decryptFromDatabase = function (log, data, accounts, require_signature) {
    const acs = getAcsFromAccounts(accounts);
    const firstName = tryDecrypt(log, data.firstName, acs);
    const lastName = tryDecrypt(log, data.lastName, acs);
    const ageGroup = tryDecrypt(log, data.ageGroup, acs);
    const isMale = tryDecrypt(log, data.isMale, acs);
    const group = tryDecrypt(log, data.group, acs);
    const handicap = tryDecrypt(log, data.handicap, acs);
    const maxAge = tryDecrypt(log, data.maxAge, acs);
    const sports = tryDecrypt(log, data.sports, acs);

    if (firstName && lastName && ageGroup && isMale && group && handicap && maxAge && sports) {

        if (accounts[firstName.usedACs.groupAC].group_permissions.indexOf(group.data) == -1 ||
            accounts[lastName.usedACs.groupAC].group_permissions.indexOf(group.data) == -1 ||
            accounts[ageGroup.usedACs.groupAC].group_permissions.indexOf(group.data) == -1 ||
            accounts[isMale.usedACs.groupAC].group_permissions.indexOf(group.data) == -1 ||
            accounts[group.usedACs.groupAC].group_permissions.indexOf(group.data) == -1 ||
            accounts[handicap.usedACs.groupAC].group_permissions.indexOf(group.data) == -1 ||
            accounts[maxAge.usedACs.groupAC].group_permissions.indexOf(group.data) == -1 ||
            accounts[sports.usedACs.groupAC].group_permissions.indexOf(group.data) == -1) {
            log.error('Der Gruppen Account, der verwendet wurde um die Daten zu speichern, hat dafür keine Berechtigung.');
            return false;
        }

        if (require_signature && !(firstName.signatureEnforced &&
            lastName.signatureEnforced &&
            ageGroup.signatureEnforced &&
            isMale.signatureEnforced &&
            group.signatureEnforced &&
            handicap.signatureEnforced &&
            maxAge.signatureEnforced &&
            sports.signatureEnforced)) {
            log.error('Die Signatur des Athleten ' + firstName.data + ' ' + lastName.data + ' konnte nicht überprüft werden, obwohl sie benötigt wird.');
            return false;
        }

        if ((firstName.signatureEnforced && accounts[firstName.usedACs.stationAC].group_permissions.indexOf(group.data) == -1) ||
            (lastName.signatureEnforced && accounts[lastName.usedACs.stationAC].group_permissions.indexOf(group.data) == -1) ||
            (ageGroup.signatureEnforced && accounts[ageGroup.usedACs.stationAC].group_permissions.indexOf(group.data) == -1) ||
            (isMale.signatureEnforced && accounts[isMale.usedACs.stationAC].group_permissions.indexOf(group.data) == -1) ||
            (group.signatureEnforced && accounts[group.usedACs.stationAC].group_permissions.indexOf(group.data) == -1) ||
            (handicap.signatureEnforced && accounts[handicap.usedACs.stationAC].group_permissions.indexOf(group.data) == -1) ||
            (maxAge.signatureEnforced && accounts[maxAge.usedACs.stationAC].group_permissions.indexOf(group.data) == -1) ||
            (sports.signatureEnforced && accounts[sports.usedACs.stationAC].group_permissions.indexOf(group.data) == -1)) {
            log.error('Der Server Account, der verwendet wurde um die Daten zu speichern, hat dafür keine Berechtigung.');
            return false;
        }

        return new Athlete(log, firstName.data, lastName.data, ageGroup.data, isMale.data, group.data, handicap.data, maxAge.data, sports.data);
    }
    log.error('Die Daten konnten nicht entschlüsselt werden.');
    return false;
};