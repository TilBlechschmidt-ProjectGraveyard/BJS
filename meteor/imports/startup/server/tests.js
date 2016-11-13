import {CompetitionTypes} from "../../api/logic/competition_type";
import {Athlete} from "../../api/logic/athlete";
import {generateAC} from "../../api/crypto/crypto";
import {Log} from "../../api/log";
// import {genRandomCode} from "../../api/crypto/pwdgen";

/**
 * Run some random tests.
 */
export function tests() {

    var ct = CompetitionTypes[0].object;
    var groupAC = generateAC("1234567ljhfaljawf8");
    var stationAC = generateAC("hflhkfks;kjfjankfa");

    var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge);
    p.age = 16;
    var log = new Log();
    p.data.update(log, "st_long_jump", [7.33], groupAC, stationAC);
    p.data.update(log, "st_ball_200", [70], groupAC, stationAC);
    p.data.update(log, "st_ball_200", [69, 70], groupAC, stationAC);
    p.data.update(log, "st_endurance_1000", [160], groupAC, stationAC);
    p.data.update(log, "st_endurance_3000", [640], groupAC, stationAC);
    p.data.update(log, "st_sprint_100", [10], groupAC, stationAC);

    console.log(ct.generateCertificate(log, p, [groupAC, stationAC], true));
    console.log(log.getAsString());
}