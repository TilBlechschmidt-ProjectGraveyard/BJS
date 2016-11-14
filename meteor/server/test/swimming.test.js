import {generateAC} from "../../imports/api/crypto/crypto";
import {CompetitionTypes} from "./../../imports/api/logic/competition_type";
import {Athlete} from "./../../imports/api/logic/athlete";
import {Log} from "../../imports/api/log";
import {chai} from "meteor/practicalmeteor:chai";
chai.should();

var ct = CompetitionTypes[1].object;
var groupAC = generateAC("1234567ljhfaljawf8");
var stationAC = generateAC("hflhkfks;kjfjankfa");

describe('swimming', function () {
    it('updates a measurement', function () {
        var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge);
        p.age = 16;
        var log = new Log();
        p.data.update(log, "st_face_up_100", [7.33], groupAC, stationAC);

        p.data.data.length.should.be.equal(1);
    });

    it('validates the configuration of Hans Müller without stationAC', function () {
        var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge);
        p.age = 16;
        var log = new Log();
        p.data.update(log, "st_face_up_100", [700], groupAC, stationAC);
        p.data.update(log, "st_diving", [13, 13], groupAC, stationAC);
        p.data.update(log, "st_crawl_100", [80], groupAC, stationAC);
        p.data.update(log, "st_butterfly_50", [70], groupAC, stationAC);

        ct.validate(log, p, [groupAC], false).should.be.equal(true);
    });

    it('validates the configuration of Hans Müller with stationAC', function () {
        var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge);
        p.age = 16;
        var log = new Log();
        p.data.update(log, "st_face_up_100", [700], groupAC, stationAC);
        p.data.update(log, "st_diving", [13, 13], groupAC, stationAC);
        p.data.update(log, "st_crawl_100", [80], groupAC, stationAC);
        p.data.update(log, "st_butterfly_50", [70], groupAC, stationAC);

        ct.validate(log, p, [groupAC, stationAC], false).should.be.equal(true);
    });

    it('validates the configuration of Hans Müller without stationAC but signature required', function () {
        var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge);
        p.age = 16;
        var log = new Log();
        p.data.update(log, "st_face_up_100", [700], groupAC, stationAC);
        p.data.update(log, "st_diving", [13, 13], groupAC, stationAC);
        p.data.update(log, "st_crawl_100", [80], groupAC, stationAC);
        p.data.update(log, "st_butterfly_50", [70], groupAC, stationAC);

        ct.validate(log, p, [groupAC], true).should.be.equal(false);
    });

    it('calculates the configuration of Hans Müller without stationAC', function () {
        var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge);
        p.age = 16;
        var log = new Log();
        p.data.update(log, "st_face_up_100", [700], groupAC, stationAC);
        p.data.update(log, "st_diving", [13, 13], groupAC, stationAC);
        p.data.update(log, "st_crawl_100", [80], groupAC, stationAC);
        p.data.update(log, "st_butterfly_50", [70], groupAC, stationAC);

        ct.calculate(log, p, [groupAC], false).should.be.equal(26);
    });

    it('calculates the configuration of Hans Müller with stationAC', function () {
        var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge);
        p.age = 16;
        var log = new Log();
        p.data.update(log, "st_face_up_100", [700], groupAC, stationAC);
        p.data.update(log, "st_diving", [13, 13], groupAC, stationAC);
        p.data.update(log, "st_crawl_100", [80], groupAC, stationAC);
        p.data.update(log, "st_butterfly_50", [70], groupAC, stationAC);

        ct.calculate(log, p, [groupAC, stationAC], false).should.be.equal(26);
    });

    it('calculates the configuration of Hans Müller without stationAC but signature required', function () {
        var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge);
        p.age = 16;
        var log = new Log();
        p.data.update(log, "st_face_up_100", [700], groupAC, stationAC);
        p.data.update(log, "st_diving", [13, 13], groupAC, stationAC);
        p.data.update(log, "st_crawl_100", [80], groupAC, stationAC);
        p.data.update(log, "st_butterfly_50", [70], groupAC, stationAC);

        ct.calculate(log, p, [groupAC], true).should.be.equal(0);
    });

    it('generates the certificate of Hans Müller', function () {
        var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge);
        p.age = 16;
        var log = new Log();
        p.data.update(log, "st_face_up_100", [700], groupAC, stationAC);
        p.data.update(log, "st_diving", [13, 13], groupAC, stationAC);
        p.data.update(log, "st_crawl_100", [80], groupAC, stationAC);
        p.data.update(log, "st_butterfly_50", [70], groupAC, stationAC);

        var certificate = ct.generateCertificate(log, p, [groupAC, stationAC], true);
        (certificate.score == 26 && certificate.certificate == 1).should.be.equal(true);
    });
});