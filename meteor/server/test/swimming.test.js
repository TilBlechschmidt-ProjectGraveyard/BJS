import {Crypto} from "../../imports/api/crypto/crypto";
import {COMPETITION_TYPES} from "./../../imports/api/logic/competition_type";
import {Athlete} from "./../../imports/api/logic/athlete";
import {Log} from "../../imports/api/log";
import {chai} from "meteor/practicalmeteor:chai";
import {Account} from "../../imports/api/logic/account";
chai.should();

const ct = COMPETITION_TYPES[1].object;
const groupAccount = new Account('Q#z', ['Q#z'], [], Crypto.generateAC('1234567ljhfaljawf8'));
const stationAccount = new Account('Stationen', [], ['st_face_up_100', 'st_diving', 'st_crawl_100', 'st_butterfly_50'], Crypto.generateAC('hflhkfks;kjfjankfa'));

describe('swimming', function () {
    it('updates a measurement', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_face_up_100', [7.33], groupAccount, stationAccount);

        p.data.data.length.should.be.equal(1);
    });

    it('validates the configuration of Hans Müller without stationAccount', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_face_up_100', [700], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_diving', [13, 13], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_crawl_100', [80], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_butterfly_50', [70], groupAccount, stationAccount);

        ct.validate(log, p, [groupAccount], false).should.be.equal(true);
    });

    it('validates the configuration of Hans Müller with stationAccount', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_face_up_100', [700], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_diving', [13, 13], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_crawl_100', [80], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_butterfly_50', [70], groupAccount, stationAccount);

        ct.validate(log, p, [groupAccount, stationAccount], false).should.be.equal(true);
    });

    it('validates the configuration of Hans Müller with stationAccount and signature required', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_face_up_100', [700], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_diving', [13, 13], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_crawl_100', [80], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_butterfly_50', [70], groupAccount, stationAccount);

        ct.validate(log, p, [groupAccount, stationAccount], true).should.be.equal(true);
    });

    it('validates the configuration of Hans Müller without stationAccount but signature required', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_face_up_100', [700], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_diving', [13, 13], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_crawl_100', [80], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_butterfly_50', [70], groupAccount, stationAccount);

        ct.validate(log, p, [groupAccount], true).should.be.equal(false);
    });

    it('calculates the configuration of Hans Müller without stationAccount', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_face_up_100', [700], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_diving', [13, 13], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_crawl_100', [80], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_butterfly_50', [70], groupAccount, stationAccount);

        ct.calculate(log, p, [groupAccount], false).should.be.equal(26);
    });

    it('calculates the configuration of Hans Müller with stationAccount', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_face_up_100', [700], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_diving', [13, 13], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_crawl_100', [80], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_butterfly_50', [70], groupAccount, stationAccount);

        ct.calculate(log, p, [groupAccount, stationAccount], false).should.be.equal(26);
    });

    it('calculates the configuration of Hans Müller with stationAccount and signature required', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_face_up_100', [700], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_diving', [13, 13], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_crawl_100', [80], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_butterfly_50', [70], groupAccount, stationAccount);

        ct.calculate(log, p, [groupAccount, stationAccount], true).should.be.equal(26);
    });

    it('calculates the configuration of Hans Müller without stationAccount but signature required', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_face_up_100', [700], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_diving', [13, 13], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_crawl_100', [80], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_butterfly_50', [70], groupAccount, stationAccount);

        ct.calculate(log, p, [groupAccount], true).should.be.equal(0);
    });

    it('generates the certificate of Hans Müller', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.addMeasurement(log, 'st_face_up_100', [700], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_diving', [13, 13], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_crawl_100', [80], groupAccount, stationAccount);
        p.addMeasurement(log, 'st_butterfly_50', [70], groupAccount, stationAccount);

        const certificate = ct.generateCertificate(log, p, [groupAccount, stationAccount], true);
        certificate.score.should.be.equal(26);
        certificate.certificate.should.be.equal(1);
    });
});