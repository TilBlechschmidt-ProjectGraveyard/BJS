import {CompetitionTypes} from "../../api/logic/competition_type";
import {Athlete} from "../../api/logic/athlete";
import {genRandomCode} from "../../api/crypto/pwdgen";
import {generateHMAC, generateAC} from "../../api/crypto/crypto";
import {Log} from "../../api/log";

/**
 * Runs some random tests.
 */
export function tests() {

    console.log("--- Testing Codes ---");

    for (var n in _.range(10)) {
        console.log(genRandomCode());
    }

    console.log("--- Testing Crypto ---");

    var HMAC = generateHMAC("Hi there!", "123456798");
    console.log("HMAC", HMAC);

    var ac = generateAC("123456798", "djlka9das9", 1);
    console.log("PWDH", ac);

    console.log("--- Testing Log ---");

    var m = new Log();

    m.addError("Error!");
    m.addWarning("Warning");
    m.addInfo("Info");

    var m2 = new Log();

    m2.addError("Error2!");
    m2.addWarning("Warning2");
    m2.addInfo("Info2");

    m.merge(m2);

    console.log(m.getAsString());
    console.log(m.getAsStringWithLevel(2));
    console.log(m.getAsStringWithMinLevel(1));

    console.log("--- Testing Logic ---");
    var ct = CompetitionTypes[0].object;
    // var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', 'B1');

    // p.data.update("st_sprint_100", 18, undefined, undefined);
    // p.data.update("st_long_jump", 1.34, undefined, undefined);
    // p.data.update("st_shot_put_5", 5.0, undefined, undefined);

    var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0');

    p.data.update("st_ball_200", 69, undefined, undefined);
    p.age = 16;

    console.log("++ validate");
    var [r1, log1] = ct.validate(p);
    console.log(r1);
    console.log(log1.getAsString());
    console.log("++ calculate");
    var [r2, log2] = ct.calculate(p);
    // console.log(type(r2));
    console.log(r2);
    console.log(log2.getAsString());
}