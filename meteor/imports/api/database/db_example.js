import {Crypto} from "../crypto/crypto";
import {Log} from "../log";
import {Account, isGroupAccount, isStationAccount, getGroupNames, getStationNames} from "../logic/account";
import {DBInterface} from "./db_access";

module.exports = function () {

    const groupAccount = new Account('Q#z', ['Q#z', 'Test'], [], Crypto.generateAC('1234567ljhfaljawf8', 'pepper'));
    const serverAccount = new Account('Admin', ['Q#z'], ['st_long_jump', 'st_ball_200', 'st_endurance_1000', 'st_endurance_3000', 'st_sprint_100'], Crypto.generateAC('hflhkfks;kjfjankfa', 'pepper'));

    const log = new Log();
    const ps = DBInterface.getAthletesOfAccounts(log, [groupAccount], false);

    console.log(log.getAsString());

    for (let p_id in ps) {
        if (!ps.hasOwnProperty(p_id)) continue;
        console.log(ps[p_id].getFullName());
    }
    console.log(groupAccount);

    const ct = DBInterface.getCompetitionType();

    console.log(isGroupAccount(groupAccount));
    console.log(isStationAccount(groupAccount));
    console.log(getGroupNames(groupAccount));
    console.log(getStationNames(groupAccount, ct));

    console.log(isGroupAccount(serverAccount));
    console.log(isStationAccount(serverAccount));
    console.log(getGroupNames(serverAccount));
    console.log(getStationNames(serverAccount, ct));


};