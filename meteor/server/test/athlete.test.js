import {Athlete} from "./../../imports/api/logic/athlete";
import {Log} from "../../imports/api/log";
import {chai} from "meteor/practicalmeteor:chai";
import {CompetitionTypes} from "../../imports/api/logic/competition_type";
import {generateAC} from "../../imports/api/crypto/crypto";
chai.should();

const ct = CompetitionTypes[0].object;

describe('athlete', function () {
    it('changes the age of an athlete', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);

        p.age = p.age + 1;

        p.ageGroup.should.be.equal(1999);
    });

    it('encrypts and decrypts', function () {
        const groupAC = generateAC('1234567ljhfaljawf8');

        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);

        const encrypted = p.encryptForDatabase(groupAC);

        const decrypted = Athlete.prototype.decryptFromDatabase(log, encrypted, [groupAC]);

        p.firstName.should.be.equal(decrypted.firstName);
        p.lastName.should.be.equal(decrypted.lastName);
        p.age.should.be.equal(decrypted.age);
        p.group.should.be.equal(decrypted.group);
        p.handicap.should.be.equal(decrypted.handicap);
    });
});