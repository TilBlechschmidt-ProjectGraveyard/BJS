export function onStartup() {
    // initDatabase();
    debugging(); // TODO: Convert this function to unit tests and remove it
}

function initDatabase() {
    var Athletes = new Mongo.Collection('Athletes');
    var Accounts = new Mongo.Collection('Accounts');
    var General = new Mongo.Collection('General');

    // var groupAC = generateAC('1234567ljhfaljawf8');
    // var stationAC = generateAC('hflhkfks;kjfjankfa');

    // Athletes.insert(new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0'));
    // var log = new Log();
    // console.log(Athletes.find({}).fetch()[0].data);
    // Athletes.find({}).fetch()[0].data.update(log, 'st_long_jump', [7.33], groupAC, stationAC);
}
// ----------------------------------------- DEBUGGING ONLY -----------------------------------------
import {CompetitionTypes} from "../../api/logic/competition_type";
import {Athlete} from "../../api/logic/athlete";
import {generateAC} from "../../api/crypto/crypto";
import {Log} from "../../api/log";
import {genRandomCode} from "../../api/crypto/pwdgen";

/**
 * Run some random tests.
 */
export function debugging() {

    const ct = CompetitionTypes[1].object;
    const groupAC = generateAC('1234567ljhfaljawf8');
    const stationAC = generateAC('hflhkfks;kjfjankfa');


    const p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge);
    p.age = 16;
    const log = new Log();
    p.data.update(log, 'st_long_jump', [7.33], groupAC, stationAC);
    p.data.update(log, 'st_face_up_100', [700], groupAC, stationAC);
    p.data.update(log, 'st_diving', [13, 13], groupAC, stationAC);
    p.data.update(log, 'st_crawl_100', [80], groupAC, stationAC);
    p.data.update(log, 'st_butterfly_50', [70], groupAC, stationAC);

    // console.log(ct.generateCertificate(log, p, [groupAC, stationAC], true));
    // console.log(ct.canDoSportType(log, p, 'st_long_jump'));
    // console.log(ct.canDoSportType(log, p, 'st_face_down_25'));
    // console.log(ct.canDoSportType(log, p, 'st_diving'));
    // console.log(ct.canDoSportType(log, p, 'st_crawl_100'));

    console.log(ct.validate(log, p, [groupAC, stationAC], false));
    console.log(ct.generateCertificate(log, p, [groupAC, stationAC], false));
    console.log(log.getAsString());


    for (let i = 0; i < 10; i++) {
        console.log(genRandomCode());
    }
}
// ----------------------------------------- TO BE REMOVED -----------------------------------------