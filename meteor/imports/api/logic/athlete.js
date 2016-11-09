/**
 * Created by noah on 08/11/2016.
 */

export {Athlete};

function Athlete(first_name, last_name, age, is_male, group, handicap) {
    this.first_name = first_name;
    this.last_name = last_name;
    this.age = age;
    this.is_male = is_male;
    this.group = group;
    this.handicap = handicap;
    /// data is an array of objects with id (view getSports) and score
    // example: [{id: 'sp_sprint', score: 16}]
    this.data = [];
}

Athlete.prototype.checkPerson = function() {
    return typeof(this.first_name) == 'string' && this.first_name != "" &&
           typeof(this.last_name)  == 'string' && this.last_name  != "" &&
           typeof(this.age)  == 'number' && this.age  > 0 &&
           typeof(this.is_male)  == 'boolean'
};

Athlete.prototype.getFullName = function() {
    return this.first_name + ' ' + this.last_name;
};


Athlete.prototype.getShortName = function() {
    return this.first_name + ' ' + this.last_name[0] + '.';
};