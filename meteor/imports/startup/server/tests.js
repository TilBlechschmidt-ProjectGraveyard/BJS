import {CompetitionTypes} from "../../api/logic/competition_type";
import {Athlete} from "../../api/logic/athlete";
import {genRandomCode} from "../../api/crypto/pwdgen";
import {generateHMAC, generateAC} from "../../api/crypto/crypto";

export function tests() {

    var ct = CompetitionTypes[0].object;

    console.log(ct.getSports());


    console.log("--- Testing Logic ---");
    var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', 'A0');

    p.data = [
        {
            id: "sp_sprint_50",
            measurement: 10.2
        },
        {
            id: "sp_long_jump",
            measurement: 3.4
        }
    ];

    console.log(p.check());
    console.log(p.getFullName());
    console.log(p.getShortName());
    console.log(p.age);
    p.age = 15;
    console.log(p.age);
    console.log(p.age_group);

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