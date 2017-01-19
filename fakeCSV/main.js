var Faker = require('faker');
var json2csv = require('json2csv');
var fs = require('fs');

// -- You are free to touch these

// Group settings
var groupSize = 30;
var groupCount = 4; // Amount of groups per layer
var groupCountDeviation = 10; // This is a randomness factor for the deviation from the previous value

// Layer settings
var layerCount = 6; // Amount of layers
var layerNumberingStart = 5; // Number to add onto the layer label

// Athlete settings
var minAge = 5;
var maxAge = 20;


// -- Do not touch anything below
// Precalculations 
var currentYear = new Date().getFullYear();
var startYear = currentYear - minAge;
var deviation = function () {
    return Math.round(Math.random()*groupCountDeviation)*0.15;
}

// Storage
var athletes = [];
var ds = { // Distribution stats
    groups: {},
    age: {}
}

for (var i = 0; i < groupSize*groupCount*layerCount; i++) {
    var groupIndex = i % (groupCount + deviation())
    var athlete = {};
    athlete.firstName = Faker.name.firstName();
    athlete.lastName = Faker.name.lastName();
    athlete.birthYear = startYear - Faker.random.number(maxAge-minAge);
    athlete.group = ((i % layerCount) + layerNumberingStart) + String.fromCharCode(97 + groupIndex);
    athlete.gender = Math.round(Math.random()) ? "männlich" : "weiblich";
    //athlete.group = 
    
    athletes.push(athlete);
}

for (var athlete in athletes) {
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
var keys = Object.keys(ds.groups);
keys.sort();
var groups = {};
for (var i = 0; i < keys.length; i++) {
    k = keys[i];
    groups[k] = ds.groups[k];
}
console.log(groups);

var csv = json2csv({
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

console.log(csv);
fs.writeFile('mockData.csv', csv, function(err) {
  if (err) throw err;
  console.log('file saved');
});

