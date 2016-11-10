/**
 * Created by noah on 08/11/2016.
 */

export {Athlete};

function Athlete(first_name, last_name, age_group, is_male, group, handicap) {
    this.first_name = first_name;
    this.last_name = last_name;
    this.age_group = age_group;
    this.is_male = is_male;
    this.group = group;
    this.handicap = handicap;
    /// data is an array of objects with id (view getSports) and measurement
    // example: [{id: 'sp_sprint', measurement: 16}]
    this.data = [];
}

Athlete.prototype = {
    check: function () {
        return typeof(this.first_name) == 'string' && this.first_name !== "" &&
            typeof(this.last_name) == 'string' && this.last_name !== "" &&
            typeof(this.age_group) == 'number' && this.age_group > 0 &&
            typeof(this.is_male) == 'boolean';
    },
    getFullName: function () {
        return this.first_name + ' ' + this.last_name;
    },
    getShortName: function () {
        return this.first_name + ' ' + this.last_name[0] + '.';
    },
    get age() {
        return new Date().getFullYear() - this.age_group;
    },
    set age(new_age) {
        this.age_group = new Date().getFullYear() - new_age;
    }
};