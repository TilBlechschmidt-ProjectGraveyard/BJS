import {Athlete} from "./../../imports/api/logic/athlete";
import {chai} from "meteor/practicalmeteor:chai";
chai.should();


describe('athlete', function () {
    it('changes the age of an athlete', function () {
        var p = new Athlete('Hans', 'Müller', 2000, true, 'Q#z', '0');

        p.age = p.age + 1;

        p.ageGroup.should.be.equal(1999);
    });
});