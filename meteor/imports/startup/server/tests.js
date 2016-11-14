import {CompetitionTypes} from "../../api/logic/competition_type";
import {Athlete} from "../../api/logic/athlete";
import {generateAC} from "../../api/crypto/crypto";
import {Log} from "../../api/log";
// import {genRandomCode} from "../../api/crypto/pwdgen";

/**
 * Run some random tests.
 */
export function tests() {

    var ct = CompetitionTypes[1].object;
    var groupAC = generateAC("1234567ljhfaljawf8");
    var stationAC = generateAC("hflhkfks;kjfjankfa");


    var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge);
    console.log(p);
    p.age = 16;
    var log = new Log();
    p.data.update(log, "st_long_jump", [7.33], groupAC, stationAC);
    p.data.update(log, "st_face_down_25", [70], groupAC, stationAC);
    p.data.update(log, "st_diving", [15, 16], groupAC, stationAC);
    p.data.update(log, "st_crawl_100", [100], groupAC, stationAC);

    // console.log(ct.generateCertificate(log, p, [groupAC, stationAC], true));
    // console.log(ct.canDoSportType(log, p, "st_long_jump"));
    // console.log(ct.canDoSportType(log, p, "st_face_down_25"));
    // console.log(ct.canDoSportType(log, p, "st_diving"));
    // console.log(ct.canDoSportType(log, p, "st_crawl_100"));

    console.log(ct.getValidData(log, p, [groupAC, stationAC], false));
    console.log(log.getAsString());
}