import {tests} from "./tests";

export function onStartup() {
    // initDatabase();
    tests();
}

function initDatabase() {
    var Athletes = new Mongo.Collection('Athletes');
    var Accounts = new Mongo.Collection('Accounts');
    var General = new Mongo.Collection('General');

    // var groupAC = generateAC("1234567ljhfaljawf8");
    // var stationAC = generateAC("hflhkfks;kjfjankfa");

    // Athletes.insert(new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0'));
    // var log = new Log();
    // console.log(Athletes.find({}).fetch()[0].data);
    // Athletes.find({}).fetch()[0].data.update(log, "st_long_jump", [7.33], groupAC, stationAC);
}