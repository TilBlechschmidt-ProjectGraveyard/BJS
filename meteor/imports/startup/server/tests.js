import {CompetitionTypes} from "../../api/logic/competition_type";
import {Athlete} from "../../api/logic/athlete";
import {genRandomCode} from "../../api/crypto/pwdgen";
import {encrypt, tryDecrypt, generateAC} from "../../api/crypto/crypto";
import {Log} from "../../api/log";

/**
 * Run some random tests.
 */
export function tests() {
    test_crypto();
    test_logic();
}

function test_codes() {
    console.log("--- Testing Codes ---");

    for (var n in _.range(10)) {
        console.log(genRandomCode());
    }
}

function test_crypto() {
    console.log("--- Testing Crypto ---");

    var group_ac = generateAC("1234567ljhfaljawf8");
    var station_ac = generateAC("hflhkfks;kjfjankfa");
    var wrong_station_ac = generateAC("blasdhiusfhsiu");
    var data = {
        a: 10,
        b: 20,
        c: 30
    };

    var encrypted_data = encrypt(data, group_ac, station_ac);
    var x = tryDecrypt(encrypted_data, [group_ac, station_ac, wrong_station_ac]);
    console.log(typeof x, x);
}

function test_log() {
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
}

function test_logic() {
    console.log("--- Testing Logic ---");
    var ct = CompetitionTypes[0].object;
    var group_ac = generateAC("1234567ljhfaljawf8");
    var station_ac = generateAC("hflhkfks;kjfjankfa");
    // var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', 'B1');

    // p.data.update("st_sprint_100", 18, undefined, undefined);
    // p.data.update("st_long_jump", 1.34, undefined, undefined);
    // p.data.update("st_shot_put_5", 5.0, undefined, undefined);

    var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0');

    p.age = 16;
    p.data.update("st_long_jump", [7.33], group_ac, station_ac);
    p.data.update("st_ball_200", [70], group_ac, station_ac);
    p.data.update("st_ball_200", [69, 70], group_ac, station_ac);
    p.data.update("st_endurance_1000", [160], group_ac, station_ac);
    p.data.update("st_endurance_3000", [640], group_ac, station_ac);
    p.data.update("st_sprint_100", [10], group_ac, station_ac);


    console.log("++ validate");
    var r1 = ct.validate(p, group_ac);
    console.log(r1.valid);
    console.log(r1.log.getAsString());
    console.log("++ calculate");
    var r2 = ct.calculate(p, group_ac, station_ac);
    console.log(r2.score);
    console.log(r2.log.getAsString());
}