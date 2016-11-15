import {generateAC, encrypt, tryDecrypt} from "../../imports/api/crypto/crypto";
import {Log} from "../../imports/api/log";
import {chai} from "meteor/practicalmeteor:chai";
chai.should();


const password = 'IAmAPotato';
const salt = 'verySaltyStuffGoingOnRightHere';

const log = new Log();
const data = {
    I: 'am',
    A: 'Potato'
};

const cachedAC1 = generateAC(password, salt);
const cachedAC2 = generateAC(password + password, salt);
const cachedSED = encrypt(data, cachedAC1, cachedAC2);

describe('crypto', function () {
    it('generates different hashes (pub/priv)', function () {
        const ac = generateAC('IAmAPotato');
        ac.privHash.should.not.be.equal(ac.pubHash);
    });

    it('generates salted ACs', function () {
        this.timeout(5000);
        generateAC(password).should.not.be.equal(generateAC(password));
    });

    it('takes a salt for AC creation', function () {
        this.timeout(5000);
        const ac1 = generateAC(password);
        const ac2 = generateAC(password, ac1.salt);

        ac1.salt.should.be.equal(ac2.salt);
    });

    it('generates reproducible ACs', function () {
        this.timeout(5000);
        const ac1 = generateAC(password);
        const ac2 = generateAC(password, ac1.salt);

        ac1.pubHash.should.be.equal(ac2.pubHash);
        ac1.privHash.should.be.equal(ac2.privHash);
    });

    it('enforces parameter passing (encrypt)', function () {
        const valid = encrypt(data, cachedAC1, cachedAC2);
        (function () {
            encrypt(data, cachedAC1);
        }).should.throw();
        (function () {
            encrypt(data);
        }).should.throw();
        (function () {
            encrypt();
        }).should.throw();

        valid.should.be.a('object');
        valid.should.have.property('groupSignature');
        valid.should.have.property('stationSignature');
        valid.should.have.property('data');
    });

    it('enforces parameter passing (tryDecrypt)', function () {
        const valid = tryDecrypt(log, cachedSED, [cachedAC1, cachedAC2]);
        (function () {
            tryDecrypt(cachedSED, [cachedAC1, cachedAC2]);
        }).should.throw(); // log missing
        (function () {
            tryDecrypt([], cachedSED, [cachedAC1, cachedAC2]);
        }).should.throw(); // log wrong type
        const stationACMissing = tryDecrypt(log, cachedSED, [cachedAC1]);
        const emptyACList = tryDecrypt(log, cachedSED, []);
        const acsMissing = tryDecrypt(log, cachedSED);
        const wrongDataType = tryDecrypt(log, {}, [cachedAC1, cachedAC2]);

        valid.should.not.be.equal(false);

        stationACMissing.should.be.a('object');
        stationACMissing.should.have.property('signatureEnforced');
        stationACMissing.signatureEnforced.should.be.equal(false);

        emptyACList.should.be.equal(false);
        acsMissing.should.be.equal(false);
        wrongDataType.should.be.equal(false);
    });

    it('decrypts data', function () {

        const decryptedData = tryDecrypt(log, cachedSED, [cachedAC1, cachedAC2]);
        JSON.stringify(decryptedData.data).should.be.equal(JSON.stringify(data));
        decryptedData.signatureEnforced.should.be.equal(true);
    });

    it('checks signatures (single)', function () {
        const decryptedData = tryDecrypt(log, cachedSED, [cachedAC1]);
        decryptedData.should.have.property('signatureEnforced');
        decryptedData.signatureEnforced.should.be.equal(false);
    });

    it('checks signatures (both)', function () {
        const verifiedDecryptedData = tryDecrypt(log, cachedSED, [cachedAC1, cachedAC2]);
        verifiedDecryptedData.should.have.property('signatureEnforced');
        verifiedDecryptedData.signatureEnforced.should.be.equal(true);
    });
});