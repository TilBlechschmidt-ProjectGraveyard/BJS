import {genRandomCode} from "../../imports/api/crypto/pwdgen";
import {chai} from "meteor/practicalmeteor:chai";
chai.should();

describe('genCode', function () {
    it('checks if genRandomCode returns a string', function () {
        (typeof(genRandomCode())).should.be.equal('string');
    });

    it('checks if genRandomCode returns a not empty string', function () {
        genRandomCode().should.not.be.equal('');
    });

    it('checks if genRandomCode returns different codes', function () {
        genRandomCode().should.not.be.equal(genRandomCode());
    });
});