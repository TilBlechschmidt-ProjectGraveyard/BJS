import {currentCompID} from "../config";
import {refreshErrorState, insertAthlete} from "./athleteList";
import {Server} from "../../../../imports/api/database/ServerInterface";
import {Athlete} from "../../../../imports/api/logic/athlete";


function findIndexByRegex(headerFields, regex) {
    return lodash.findIndex(headerFields, function (field) {
        const regexRes = field.match(regex);
        return regexRes !== null ? regexRes.length > 0 : false;
    });
}

function hasDuplicates(a) {
    return _.uniq(a).length !== a.length;
}

function correlateHeaders(headerFields) {
    const firstname = findIndexByRegex(headerFields, /(vor|tauf|ruf|first|fore|given|christian)/gi);

    const lastname = findIndexByRegex(headerFields, /(nach|eigen|familien|vater|last|sur|family)/gi);

    const ageGroup = findIndexByRegex(headerFields, /(alter|geburt|jahr|generation|stufe|geb|age|year|birth|life)/gi);

    const gender = findIndexByRegex(headerFields, /(geschlecht|gattung|sex|gender)/gi);

    const group = findIndexByRegex(headerFields, /(gruppe|klasse|verband|gesell|team|verein|gemein|bund|mannschaft|group|col)/gi);

    const headerIndices = [firstname, lastname, ageGroup, gender, group];
    if (hasDuplicates(headerIndices))
        console.warn("Duplicate header fields @ CSV File");

    return {
        firstName: headerFields[firstname],
        lastName: headerFields[lastname],
        ageGroup: headerFields[ageGroup],
        gender: headerFields[gender],
        group: headerFields[group]
    };
}

function processCSVResult(dataset, field, ct) {
    for (let data in dataset) {
        if (!dataset.hasOwnProperty(data)) continue;
        data = dataset[data];
        const gender = data[field["gender"]];
        const athlete = new Athlete(Meteor.config.log, data[field["firstName"]], data[field["lastName"]], parseInt(data[field["ageGroup"]]), gender.match(/m/gi) !== null, data[field["group"]], '0', ct.maxAge, ct);
        insertAthlete(athlete);
    }
    refreshErrorState();
}

export function parseCSVFile(file) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            const compID = currentCompID.get();
            const ct = Server.getCompetitionType(compID);
            const field = correlateHeaders(results.meta.fields);
            processCSVResult(results.data, field, ct);
        },
    });
}

Template.csvImport.events({
    'change input[type=file]#csv-upload': function (event) {
        const files = event.target.files;
        for (let file in files) {
            if (!files.hasOwnProperty(file)) continue;
            file = files[file];
            parseCSVFile(file);
        }
    }
});