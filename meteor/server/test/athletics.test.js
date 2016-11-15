import {generateAC} from "../../imports/api/crypto/crypto";
import {CompetitionTypes} from "./../../imports/api/logic/competition_type";
import {Athlete} from "./../../imports/api/logic/athlete";
import {Log} from "../../imports/api/log";
import {chai} from "meteor/practicalmeteor:chai";
chai.should();

const ct = CompetitionTypes[0].object;
const groupAC = generateAC('1234567ljhfaljawf8');
const stationAC = generateAC('hflhkfks;kjfjankfa');

describe('athletics', function () {
    it('updates a measurement', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.data.update(log, 'st_long_jump', [7.33], groupAC, stationAC);

        p.data.data.length.should.be.equal(1);
    });

    it('validates the configuration of Hans Müller without stationAC', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.data.update(log, 'st_long_jump', [7.33], groupAC, stationAC);
        p.data.update(log, 'st_ball_200', [70], groupAC, stationAC);
        p.data.update(log, 'st_ball_200', [69, 70], groupAC, stationAC);
        p.data.update(log, 'st_endurance_1000', [160], groupAC, stationAC);
        p.data.update(log, 'st_endurance_3000', [640], groupAC, stationAC);
        p.data.update(log, 'st_sprint_100', [10], groupAC, stationAC);

        ct.validate(log, p, [groupAC], false).should.be.equal(true);
    });

    it('validates the configuration of Hans Müller with stationAC', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.data.update(log, 'st_long_jump', [7.33], groupAC, stationAC);
        p.data.update(log, 'st_ball_200', [70], groupAC, stationAC);
        p.data.update(log, 'st_ball_200', [69, 70], groupAC, stationAC);
        p.data.update(log, 'st_endurance_1000', [160], groupAC, stationAC);
        p.data.update(log, 'st_endurance_3000', [640], groupAC, stationAC);
        p.data.update(log, 'st_sprint_100', [10], groupAC, stationAC);

        ct.validate(log, p, [groupAC, stationAC], false).should.be.equal(true);
    });

    it('validates the configuration of Hans Müller without stationAC but signature required', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.data.update(log, 'st_long_jump', [7.33], groupAC, stationAC);
        p.data.update(log, 'st_ball_200', [70], groupAC, stationAC);
        p.data.update(log, 'st_ball_200', [69, 70], groupAC, stationAC);
        p.data.update(log, 'st_endurance_1000', [160], groupAC, stationAC);
        p.data.update(log, 'st_endurance_3000', [640], groupAC, stationAC);
        p.data.update(log, 'st_sprint_100', [10], groupAC, stationAC);

        ct.validate(log, p, [groupAC], true).should.be.equal(false);
    });

    it('calculates the configuration of Hans Müller without stationAC', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.data.update(log, 'st_long_jump', [7.33], groupAC, stationAC);
        p.data.update(log, 'st_ball_200', [70], groupAC, stationAC);
        p.data.update(log, 'st_ball_200', [69, 70], groupAC, stationAC);
        p.data.update(log, 'st_endurance_1000', [160], groupAC, stationAC);
        p.data.update(log, 'st_endurance_3000', [640], groupAC, stationAC);
        p.data.update(log, 'st_sprint_100', [10], groupAC, stationAC);

        ct.calculate(log, p, [groupAC], false).should.be.equal(2195);
    });

    it('calculates the configuration of Hans Müller with stationAC', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.data.update(log, 'st_long_jump', [7.33], groupAC, stationAC);
        p.data.update(log, 'st_ball_200', [70], groupAC, stationAC);
        p.data.update(log, 'st_ball_200', [69, 70], groupAC, stationAC);
        p.data.update(log, 'st_endurance_1000', [160], groupAC, stationAC);
        p.data.update(log, 'st_endurance_3000', [640], groupAC, stationAC);
        p.data.update(log, 'st_sprint_100', [10], groupAC, stationAC);

        ct.calculate(log, p, [groupAC, stationAC], false).should.be.equal(2195);
    });

    it('calculates the configuration of Hans Müller without stationAC but signature required', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.data.update(log, 'st_long_jump', [7.33], groupAC, stationAC);
        p.data.update(log, 'st_ball_200', [70], groupAC, stationAC);
        p.data.update(log, 'st_ball_200', [69, 70], groupAC, stationAC);
        p.data.update(log, 'st_endurance_1000', [160], groupAC, stationAC);
        p.data.update(log, 'st_endurance_3000', [640], groupAC, stationAC);
        p.data.update(log, 'st_sprint_100', [10], groupAC, stationAC);

        ct.calculate(log, p, [groupAC], true).should.be.equal(0);
    });

    it('generates the certificate of Hans Müller', function () {
        const log = new Log();
        const p = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct);
        p.age = 16;
        p.data.update(log, 'st_long_jump', [7.33], groupAC, stationAC);
        p.data.update(log, 'st_ball_200', [70], groupAC, stationAC);
        p.data.update(log, 'st_ball_200', [69, 70], groupAC, stationAC);
        p.data.update(log, 'st_endurance_1000', [160], groupAC, stationAC);
        p.data.update(log, 'st_endurance_3000', [640], groupAC, stationAC);
        p.data.update(log, 'st_sprint_100', [10], groupAC, stationAC);

        const certificate = ct.generateCertificate(log, p, [groupAC, stationAC], true);
        certificate.score.should.be.equal(2195);
        certificate.certificate.should.be.equal(2);
    });
});