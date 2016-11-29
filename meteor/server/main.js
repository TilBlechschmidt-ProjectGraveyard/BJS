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
    const serverAccount = new Account(['Q#z'], ['st_long_jump', 'st_ball_200', 'st_ball_200', 'st_endurance_1000', 'st_endurance_3000', 'st_sprint_100'], generateAC('hflhkfks;kjfjankfa'));

    const log = new Log();
    const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
    const encrypted_p = p.encryptForDatabase(groupAccount, serverAccount);
    const decrypted_p = Athlete.prototype.decryptFromDatabase(log, encrypted_p, [groupAccount, serverAccount], true);
    console.log(log.getAsString());
    const decrypted_p2 = Athlete.prototype.decryptFromDatabase(log, encrypted_p, [groupAccount], false);
    const decrypted_p3 = Athlete.prototype.decryptFromDatabase(log, encrypted_p, [groupAccount], true);


    console.log(decrypted_p);
    console.log(decrypted_p2);
    console.log(decrypted_p3);
});