import {Athlete} from "./../../imports/api/logic/athlete";
import {Log} from "../../imports/api/log";
import {chai} from "meteor/practicalmeteor:chai";
import {COMPETITION_TYPES} from "../../imports/api/logic/competition_type";
import {Crypto} from "../../imports/api/crypto/crypto";
import {Account} from "../../imports/api/logic/account";

chai.should();

const ct = COMPETITION_TYPES[0].object;

const groupAccount = new Account(['Q#z'], [], Crypto.generateAC('1234567ljhfaljawf8'));
const serverAccount = new Account(['Q#z'], [], Crypto.generateAC('sdfjhsiufhuihr438ry34'));

describe('athlete', function () {
    it('changes the age of an athlete', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);

        p.age = p.age + 1;

        p.ageGroup.should.be.equal(1999);
    });

    it('encrypts and decrypts an athlete without serverAccount', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.addMeasurement(log, 'st_long_jump', [7.33], groupAccount, serverAccount);
        const encrypted_p = p.encryptForDatabase(groupAccount, serverAccount);
        const decrypted_p = Athlete.decryptFromDatabase(log, encrypted_p, [groupAccount], false);

        decrypted_p.firstName.should.be.equal(p.firstName);
        decrypted_p.lastName.should.be.equal(p.lastName);
        decrypted_p.ageGroup.should.be.equal(p.ageGroup);
        decrypted_p.isMale.should.be.equal(p.isMale);
        decrypted_p.group.should.be.equal(p.group);
        decrypted_p.handicap.should.be.equal(p.handicap);
        decrypted_p.maxAge.should.be.equal(p.maxAge);
    });

    it('encrypts and decrypts an athlete with serverAccount', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        const encrypted_p = p.encryptForDatabase(groupAccount, serverAccount);
        const decrypted_p = Athlete.decryptFromDatabase(log, encrypted_p, [groupAccount, serverAccount], false);

        decrypted_p.firstName.should.be.equal(p.firstName);
        decrypted_p.lastName.should.be.equal(p.lastName);
        decrypted_p.ageGroup.should.be.equal(p.ageGroup);
        decrypted_p.isMale.should.be.equal(p.isMale);
        decrypted_p.group.should.be.equal(p.group);
        decrypted_p.handicap.should.be.equal(p.handicap);
        decrypted_p.maxAge.should.be.equal(p.maxAge);
    });

    it('encrypts and decrypts an athlete with serverAccount and signature required', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        const encrypted_p = p.encryptForDatabase(groupAccount, serverAccount);
        const decrypted_p = Athlete.decryptFromDatabase(log, encrypted_p, [groupAccount, serverAccount], true);

        decrypted_p.firstName.should.be.equal(p.firstName);
        decrypted_p.lastName.should.be.equal(p.lastName);
        decrypted_p.ageGroup.should.be.equal(p.ageGroup);
        decrypted_p.isMale.should.be.equal(p.isMale);
        decrypted_p.group.should.be.equal(p.group);
        decrypted_p.handicap.should.be.equal(p.handicap);
        decrypted_p.maxAge.should.be.equal(p.maxAge);
    });

    it('encrypts and decrypts an athlete without serverAccount but signature required', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        const encrypted_p = p.encryptForDatabase(groupAccount, serverAccount);
        const decrypted_p = Athlete.decryptFromDatabase(log, encrypted_p, [groupAccount], true);

        decrypted_p.should.be.equal(false);
    });
});