import {Data} from "./data";
import {Crypto} from "./../crypto/crypto.js";
import {genUUID} from "./../crypto/pwdgen";
import {getAcsFromAccounts} from "./account";
import {DBInterface} from "../database/db_access";


/**
 * Creates a new Athlete with the given information.
 * @param {Log} log Logger instance to use
 * @param {string} firstName first-name of the athlete
 * @param {string} lastName last-name of the athlete
 * @param {number} ageGroup Age category of the athlete
 * @param {boolean} isMale Whether or not the athlete is male
 * @param {string} group Identifier of the group this athlete is part of
 * @param {string} handicap Handicap id of the athlete
 * @param {number} maxAge The max age provided by the competition type (ct.maxAge)
 * @param {String[]|object} ct List of sports the athlete can do or a competition type object
 * @param {string} [id] - Mongo DB id
 * @constructor
 */
export function Athlete(log, firstName, lastName, ageGroup, isMale, group, handicap, maxAge, ct, id) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.ageGroup = ageGroup;
    this.isMale = isMale;
    this.group = group;
    this.handicap = handicap;
    this.maxAge = maxAge;
    this.id = id;

    if (ct.constructor == Array) {
        this.sports = ct;
    } else {
        this.sports = [];

        let sportTypes;
        if (DBInterface.isReady()) sportTypes = DBInterface.getActivatedSports();

        const allSports = ct.getSports();
        for (let sport in allSports) {
            if (ct.canDoSportType(log, this, allSports[sport].id).canDoSport) {
                const stID = allSports[sport].id;
                if (!sportTypes || sportTypes.indexOf(stID) > 0) {
                    this.sports.push(stID);
                }
            }
        }
    }

    /// data is an array of objects with id (view getSports) and measurement
    // example: [{id: 'st_sprint', measurement: 16}]
    this.data = new Data();
}

Athlete.prototype = {
    /**
     * Returns the data in plain text.
     * @param {Log} log Logger instance to use
     * @param {Account[]} accounts
     * @param {boolean} requireSignature
     * @returns {PlainData[]}
     */
    getPlain: function (log, accounts, requireSignature) {
        return this.data.getPlain(log, accounts, requireSignature, this.group);
    },


    /**
     * Updates the data of a given sport (stID).
     * @param {Log} log Logger instance to use
     * @param {string} stID Identifier of the sport that should get updated/new values
     * @param {number[]} newMeasurements New measurements that should be inserted
     * @param {Account} groupAccount Account of the group this athlete is part of
     * @param {Account} stationAccount Account of the station responsible for this sport type
     * @returns {boolean} A boolean value that describes whether or not the update was successful
     */
    addMeasurement: function (log, stID, newMeasurements, groupAccount, stationAccount) {

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
            this.data.push(log, stID, newMeasurements, groupAccount.ac, stationAccount.ac);
            // write to db
            if (this.id) {
                let writeObject = {};
                writeObject["m_" + genUUID()] = this.data.data[this.data.data.length - 1];
                Meteor.COLLECTIONS.Athletes.handle.update({_id: this.id}, {$set: writeObject});
            }
            return true;
        } else {
            return false;
        }
    },

    /**
     * Checks whether the properties of the athlete are correct.
     * @param {Log} log Logger instance to use
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
     * Returns the age of the athlete. This might not be the correct age but for the BJS only the year of birth is important. If the age is greater than the max age of the Competition Type, this age is returned.
     * @returns {number}
     */
    get tableAge() {
        return Math.min(new Date().getFullYear() - this.ageGroup, this.maxAge);
    },
    /**
     * Sets the age of the athlete.
     * @param {integer} newAge - New age of the athlete
     */
    set age(newAge) {
        this.ageGroup = new Date().getFullYear() - newAge;
    },

    /**
     * Encrypts the athlete for the database
     * @param {Account} groupAccount - Account of the group that this athlete is part of
     * @param {Account} serverAccount - Master account (?) TODO Describe this in a meaningful fashion
     * @returns {Object}
     */
    encryptForDatabase: function (groupAccount, serverAccount) {
        const encrypted = {};

        encrypted.firstName = Crypto.encrypt(this.firstName, groupAccount.ac, serverAccount.ac);
        encrypted.lastName = Crypto.encrypt(this.lastName, groupAccount.ac, serverAccount.ac);
        encrypted.ageGroup = Crypto.encrypt(this.ageGroup, groupAccount.ac, serverAccount.ac);
        encrypted.isMale = Crypto.encrypt(this.isMale, groupAccount.ac, serverAccount.ac);
        encrypted.group = Crypto.encrypt(this.group, groupAccount.ac, serverAccount.ac);
        encrypted.handicap = Crypto.encrypt(this.handicap, groupAccount.ac, serverAccount.ac);
        encrypted.maxAge = Crypto.encrypt(this.maxAge, groupAccount.ac, serverAccount.ac);

        encrypted.sports = Crypto.encrypt(this.sports, groupAccount.ac, serverAccount.ac);


        for (let dataGroupID in this.data.data) {
            encrypted["m_" + genUUID()] = this.data[dataGroupID];
        }

        return encrypted;
    }
};

/**
 * Decrypts the data from the database
 * @param {Log} log Logger instance to use
 * @param {Object} data Encrypted athlete
 * @param {Account[]} accounts List of accounts containing the one that was used for encryption
 * @param {boolean} require_signature whether or not to enable signature enforcing
 * @returns {boolean|Athlete}
 */
Athlete.decryptFromDatabase = function (log, data, accounts, require_signature) {
    const acs = getAcsFromAccounts(accounts);
    const firstName = Crypto.tryDecrypt(log, data.firstName, acs);
    const lastName = Crypto.tryDecrypt(log, data.lastName, acs);
    const ageGroup = Crypto.tryDecrypt(log, data.ageGroup, acs);
    const isMale = Crypto.tryDecrypt(log, data.isMale, acs);
    const group = Crypto.tryDecrypt(log, data.group, acs);
    const handicap = Crypto.tryDecrypt(log, data.handicap, acs);
    const maxAge = Crypto.tryDecrypt(log, data.maxAge, acs);
    const sports = Crypto.tryDecrypt(log, data.sports, acs);

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

        let athlete = new Athlete(log, firstName.data, lastName.data, ageGroup.data, isMale.data, group.data, handicap.data, maxAge.data, sports.data, data._id);

        let measureData = [];

        for (let memberName in data) {
            if (memberName.substr(0, 2) === "m_") {
                measureData.push(data[memberName]);
            }
        }


        athlete.data = new Data(measureData);
        return athlete;
    }
    log.error('Die Daten konnten nicht entschlüsselt werden.');
    return false;
};