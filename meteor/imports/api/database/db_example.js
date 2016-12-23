/**
 * Created by noah on 12/23/16.
 */
import {COMPETITION_TYPES} from "../logic/competition_type";
import {generateAC} from "../crypto/crypto";
import {Log} from "../log";
import {Account} from "../logic/account";
import {getAthletesOfAccounts} from "./db_access";

module.exports = function () {
    const ct = COMPETITION_TYPES[0].object;

    const groupAccount = new Account(['Q#z'], [], generateAC('1234567ljhfaljawf8', 'pepper'));
    const serverAccount = new Account(['Q#z'], ['st_long_jump', 'st_ball_200', 'st_ball_200', 'st_endurance_1000', 'st_endurance_3000', 'st_sprint_100'], generateAC('hflhkfks;kjfjankfa', 'pepper'));

    const log = new Log();
    const ps = getAthletesOfAccounts(log, [groupAccount], false);

    console.log(log.getAsString());

    for (let p_id in ps) {
        console.log(ps[p_id].getFullName());
    }
    console.log(groupAccount);
};