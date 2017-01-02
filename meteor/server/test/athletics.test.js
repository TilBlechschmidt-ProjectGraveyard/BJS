import {Crypto} from "../../imports/api/crypto/crypto";
import {COMPETITION_TYPES} from "./../../imports/api/logic/competition_type";
import {Athlete} from "./../../imports/api/logic/athlete";
import {Log} from "../../imports/api/log";
import {chai} from "meteor/practicalmeteor:chai";
import {Account} from "../../imports/api/logic/account";
chai.should();

const ct = COMPETITION_TYPES[0].object;
const groupAccount = new Account('Q#z', ['Q#z'], [], Crypto.generateAC('1234567ljhfaljawf8'));
const stationAccount = new Account('Stationen', [], ['st_long_jump', 'st_ball_200', 'st_endurance_1000', 'st_endurance_3000', 'st_sprint_100'], Crypto.generateAC('hflhkfks;kjfjankfa'));

describe('athletics', function () {
    it('updates a measurement', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_long_jump', [7.33], groupAccount, stationAccount);

        p.data.data.length.should.be.equal(1);
    });

    it('validates the configuration of Hans Müller without stationAccount', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_long_jump', [7.33], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [69, 70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_1000', [160], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_3000', [640], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_sprint_100', [10], groupAccount, stationAccount);

        ct.validate(log, p, [groupAccount], false).should.be.equal(true);
    });

    it('validates the configuration of Hans Müller with stationAccount', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_long_jump', [7.33], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [69, 70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_1000', [160], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_3000', [640], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_sprint_100', [10], groupAccount, stationAccount);

        ct.validate(log, p, [groupAccount, stationAccount], false).should.be.equal(true);
    });

    it('validates the configuration of Hans Müller with stationAccount and signature required', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_long_jump', [7.33], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [69, 70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_1000', [160], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_3000', [640], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_sprint_100', [10], groupAccount, stationAccount);

        ct.validate(log, p, [groupAccount, stationAccount], true).should.be.equal(true);
    });

    it('validates the configuration of Hans Müller without stationAccount but signature required', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_long_jump', [7.33], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [69, 70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_1000', [160], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_3000', [640], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_sprint_100', [10], groupAccount, stationAccount);

        ct.validate(log, p, [groupAccount], true).should.be.equal(false);
    });

    it('calculates the configuration of Hans Müller without stationAccount', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_long_jump', [7.33], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [69, 70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_1000', [160], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_3000', [640], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_sprint_100', [10], groupAccount, stationAccount);

        ct.calculate(log, p, [groupAccount], false).score.should.be.equal(2195);
    });

    it('calculates the configuration of Hans Müller with stationAccount', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_long_jump', [7.33], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [69, 70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_1000', [160], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_3000', [640], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_sprint_100', [10], groupAccount, stationAccount);

        ct.calculate(log, p, [groupAccount, stationAccount], false).score.should.be.equal(2195);
    });

    it('calculates the configuration of Hans Müller with stationAccount and signature required', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_long_jump', [7.33], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [69, 70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_1000', [160], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_3000', [640], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_sprint_100', [10], groupAccount, stationAccount);

        ct.calculate(log, p, [groupAccount, stationAccount], true).score.should.be.equal(2195);
    });

    it('calculates the configuration of Hans Müller without stationAccount but signature required', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_long_jump', [7.33], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [69, 70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_1000', [160], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_3000', [640], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_sprint_100', [10], groupAccount, stationAccount);

        ct.calculate(log, p, [groupAccount], true).score.should.be.equal(0);
    });

    it('generates the certificate of Hans Müller', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_long_jump', [7.33], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_ball_200', [69, 70], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_1000', [160], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_endurance_3000', [640], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_sprint_100', [10], groupAccount, stationAccount);

        const certificate = ct.generateCertificate(log, p, [groupAccount, stationAccount], true);
        certificate.score.should.be.equal(2195);
        certificate.certificate.should.be.equal(2);
    });
});