import {Crypto} from "../crypto/crypto";
import {Log} from "../log";
import {Account, isGroupAccount, isStationAccount, getGroupNames, getStationNames} from "../logic/account";
import {DBInterface} from "./db_access";

module.exports = function () {

    const groupAccount = new Account(['Q#z', 'Test'], [], Crypto.generateAC('1234567ljhfaljawf8', 'pepper'));
    const serverAccount = new Account(['Q#z'], ['st_long_jump', 'st_ball_200', 'st_endurance_1000', 'st_endurance_3000', 'st_sprint_100'], Crypto.generateAC('hflhkfks;kjfjankfa', 'pepper'));

    const log = new Log();
    const ps = DBInterface.getAthletesOfAccounts(log, [groupAccount], false);

    console.log(log.getAsString());

    for (let p_id in ps) {
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


    // const ct = DBInterface.getCompetitionType();
    //
    // const log = new Log();
    // const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
    // p.addMeasurement(log, 'st_long_jump', [7.33], groupAccount, serverAccount);
    // const encrypted_p = p.encryptForDatabase(groupAccount, serverAccount);
    // const decrypted_p = Athlete.decryptFromDatabase(log, encrypted_p, [groupAccount], false);
    //
    // console.log("Output");
    // console.log(encrypted_p.data.data);
    // const d = new Data(encrypted_p.data.data);
    // console.log(d);
    // const plain = d.getPlain(log, [groupAccount, serverAccount], false, groupAccount.group_permissions[0]);
    // console.log(plain);
    // console.log(plain[0].measurements);

};