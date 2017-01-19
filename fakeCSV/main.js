const Faker = require('faker');
const json2csv = require('json2csv');
const fs = require('fs');
const gender = require("gender-guess");

// -- You are free to touch these

// Group settings
const averageGroupSize = 21;
const groupCount = 4; // Amount of groups per layer
const groupSizeDeviation = 3; // This is a randomness factor for the deviation from the previous value

// Layer settings
const layerCount = 6; // Amount of layers
const layerNumberingStart = 5; // Number to add onto the layer label

// Athlete settings
const relMinAge = 3;
const relMaxAge = 4;


// -- Do not touch anything below
// Precalculations 
const currentYear = new Date().getFullYear();
const startYear = currentYear - relMinAge;
const relAgeDiff = relMaxAge - relMinAge;

// Storage
const athletes = [];
const ds = { // Distribution stats
    groups: {},
    age: {}
};

for (let layerNumber = layerNumberingStart; layerNumber - layerNumberingStart < layerCount; layerNumber++) {
    for (let groupIndex = 0; groupIndex < groupCount; groupIndex++) {
        let groupSize = averageGroupSize + Faker.random.number(2 * groupSizeDeviation) - groupSizeDeviation;
        for (let athleteNumber = 0; athleteNumber < groupSize; athleteNumber++) {
            const athlete = {};
            athlete.firstName = Faker.name.firstName();
            athlete.lastName = Faker.name.lastName();
            const genderGuess = gender.guess(athlete.firstName);
            athlete.gender = (genderGuess !== undefined && genderGuess.gender == "M") ? "männlich" : "weiblich";

            athlete.birthYear = startYear - (relMinAge + Faker.random.number(relAgeDiff)) - layerNumber;
            athlete.group = layerNumber + String.fromCharCode(97 + groupIndex);

            athletes.push(athlete);
        }
    }
}

// for (var i = 0; i < groupSize*groupCount*layerCount; i++) {
//     var groupIndex = i % (groupCount + deviation())
//     var athlete = {};
//     athlete.firstName = Faker.name.firstName();
//     athlete.lastName = Faker.name.lastName();
//     athlete.birthYear = startYear - Faker.random.number(maxAge-minAge);
//     const age = currentYear - athlete.birthYear;
//     athlete.group = (age - 3 + Math.round(Math.random())) + String.fromCharCode(97 + groupIndex);
//     athlete.gender = Math.round(Math.random()) ? "männlich" : "weiblich";
//     //athlete.group =
//
//     athletes.push(athlete);
// }

for (let athlete in athletes) {
    if (!athletes.hasOwnProperty(athlete)) continue;
    athlete = athletes[athlete];
    
    if (!ds.groups[athlete.group]) ds.groups[athlete.group] = 1;
    else ds.groups[athlete.group]++;

    if (!ds.age[athlete.birthYear]) ds.age[athlete.birthYear] = 1;
    else ds.age[athlete.birthYear]++;
}

ds.athletes = athletes.length;

console.log("Total athletes:", ds.athletes);
console.log("--- BirthYear distribution ---");
console.log(ds.age);

console.log("--------- Group sizes --------");
// Sort it by class name first
const keys = Object.keys(ds.groups);
keys.sort();
const groups = {};
for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    groups[k] = ds.groups[k];
}
console.log(groups);

const csv = json2csv({
    data: athletes,
    fields: [
        "firstName",
        "lastName",
        "birthYear",
        "group",
        "gender"
    ],
    fieldNames: [
        "Vorname",
        "Nachname",
        "GebJahr",
        "Gruppe",
        "Geschlecht"
    ]
});

fs.writeFile('mockData.csv', csv, function(err) {
  if (err) throw err;
  console.log('file saved');
});

