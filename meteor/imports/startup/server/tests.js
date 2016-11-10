import {CompetitionTypes} from "../../api/logic/competition_type";
import {Athlete} from "../../api/logic/athlete";
import {genRandomCode} from "../../api/crypto/pwdgen";
import {generateHMAC, generateAC} from "../../api/crypto/crypto";

/**
 * Runs some random tests.
 */
export function tests() {

    var ct = CompetitionTypes[0].object;


    console.log("--- Testing Logic ---");
    var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', 'A0');

    p.data.update("st_sprint_50", 10.2, undefined, undefined);
    p.data.update("st_long_jump", 3.4, undefined, undefined);


    console.log(p.check());
    console.log(p.getFullName());
    console.log(p.getShortName());
    console.log(p.age);
    p.age = 15;
    console.log(p.age);
    console.log(p.age_group);
    console.log(p.data);

    console.log(ct.validate(p));

    console.log("--- Testing Codes ---");

    for (var n in _.range(10)) {
        console.log(genRandomCode());
    }

    console.log("--- Testing Crypto ---");

    var HMAC = generateHMAC("Hi there!", "123456798");
    console.log("HMAC", HMAC);

    var ac = generateAC("123456798", "djlka9das9", 1);
    console.log("PWDH", ac);
}