import {Meteor} from "meteor/meteor";
import {onStartup} from "../imports/startup/server/index.js";
import {Athlete} from "../imports/api/logic/athlete";
import {COMPETITION_TYPES} from "../imports/api/logic/competition_type";
import {generateAC} from "../imports/api/crypto/crypto";
import {Log} from "../imports/api/log";
import {Account} from "../imports/api/logic/account";

Meteor.startup(function () {
    onStartup();


    const ct = COMPETITION_TYPES[0].object;
    const groupAccount = new Account(['Q#z'], [], generateAC('1234567ljhfaljawf8'));
    const stationAccount = new Account([], ['st_long_jump', 'st_ball_200', 'st_ball_200', 'st_endurance_1000', 'st_endurance_3000', 'st_sprint_100'], generateAC('hflhkfks;kjfjankfa'));

    const log = new Log();
    const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
    p.age = 16;
    p.update(log, 'st_long_jump', [7.33], groupAccount, stationAccount);
    p.update(log, 'st_ball_200', [70], groupAccount, stationAccount);
    p.update(log, 'st_ball_200', [69, 70], groupAccount, stationAccount);
    p.update(log, 'st_endurance_1000', [160], groupAccount, stationAccount);
    p.update(log, 'st_endurance_3000', [640], groupAccount, stationAccount);
    p.update(log, 'st_sprint_100', [10], groupAccount, stationAccount);

    console.log(p.data);

    console.log(ct.calculate(log, p, [groupAccount], false));

    console.log(ct.validate(log, p, [groupAccount, stationAccount], false));

    console.log(log.getAsString());
});