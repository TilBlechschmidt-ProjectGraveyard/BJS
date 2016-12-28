import {Crypto} from '../../imports/api/crypto/crypto';
import {Log} from '../../imports/api/log';
import {chai} from 'meteor/practicalmeteor:chai';
chai.should();


const password = 'IAmAPotato';
const salt = 'verySaltyStuffGoingOnRightHere';

const log = new Log();
const data = {
    I: 'am',
    A: 'Potato'
};

const cachedAC1 = Crypto.generateAC(password, salt);
const cachedAC2 = Crypto.generateAC(password + password, salt);
const cachedSED = Crypto.encrypt(data, cachedAC1, cachedAC2);

describe('crypto', function () {
    it('generates different hashes (pub/priv)', function () {
        const ac = Crypto.generateAC('IAmAPotato');
        ac.privHash.should.not.be.equal(ac.pubHash);
    });

    it('generates salted ACs', function () {
        this.timeout(5000);
        Crypto.generateAC(password).should.not.be.equal(Crypto.generateAC(password));
    });

    it('takes a salt for AC creation', function () {
        this.timeout(5000);
        const ac1 = Crypto.generateAC(password);
        const ac2 = Crypto.generateAC(password, ac1.salt);

        ac1.salt.should.be.equal(ac2.salt);
    });

    it('generates reproducible ACs', function () {
        this.timeout(5000);
        const ac1 = Crypto.generateAC(password);
        const ac2 = Crypto.generateAC(password, ac1.salt);

        ac1.pubHash.should.be.equal(ac2.pubHash);
        ac1.privHash.should.be.equal(ac2.privHash);
    });

    it('enforces parameter passing (encrypt)', function () {
        const valid = Crypto.encrypt(data, cachedAC1, cachedAC2);
        (function () {
            Crypto.encrypt(data, cachedAC1);
        }).should.throw();
        (function () {
            Crypto.encrypt(data);
        }).should.throw();
        (function () {
            Crypto.encrypt();
        }).should.throw();

        valid.should.be.a('object');
        valid.should.have.property('groupSignature');
        valid.should.have.property('stationSignature');
        valid.should.have.property('data');
    });

    it('enforces parameter passing (tryDecrypt)', function () {
        const valid = Crypto.tryDecrypt(log, cachedSED, [cachedAC1, cachedAC2]);
        (function () {
            Crypto.tryDecrypt(cachedSED, [cachedAC1, cachedAC2]);
        }).should.throw(); // log missing
        (function () {
            Crypto.tryDecrypt([], cachedSED, [cachedAC1, cachedAC2]);
        }).should.throw(); // log wrong type
        const stationACMissing = Crypto.tryDecrypt(log, cachedSED, [cachedAC1]);
        const emptyACList = Crypto.tryDecrypt(log, cachedSED, []);
        const acsMissing = Crypto.tryDecrypt(log, cachedSED);
        const wrongDataType = Crypto.tryDecrypt(log, {}, [cachedAC1, cachedAC2]);

        valid.should.not.be.equal(false);

        stationACMissing.should.be.a('object');
        stationACMissing.should.have.property('signatureEnforced');
        stationACMissing.signatureEnforced.should.be.equal(false);

        emptyACList.should.be.equal(false);
        acsMissing.should.be.equal(false);
        wrongDataType.should.be.equal(false);
    });

    it('decrypts data', function () {

        const decryptedData = Crypto.tryDecrypt(log, cachedSED, [cachedAC1, cachedAC2]);
        JSON.stringify(decryptedData.data).should.be.equal(JSON.stringify(data));
        decryptedData.signatureEnforced.should.be.equal(true);
    });

    it('checks signatures (single)', function () {
        const decryptedData = Crypto.tryDecrypt(log, cachedSED, [cachedAC1]);
        decryptedData.should.have.property('signatureEnforced');
        decryptedData.signatureEnforced.should.be.equal(false);
    });

    it('checks signatures (both)', function () {
        const verifiedDecryptedData = Crypto.tryDecrypt(log, cachedSED, [cachedAC1, cachedAC2]);
        verifiedDecryptedData.should.have.property('signatureEnforced');
        verifiedDecryptedData.signatureEnforced.should.be.equal(true);
    });

    it('returns the used group signature', function () {
        const verifiedDecryptedData = Crypto.tryDecrypt(log, cachedSED, [cachedAC1, cachedAC2]);
        verifiedDecryptedData.should.have.property('usedACs');
        verifiedDecryptedData.usedACs.should.have.property('groupAC');
        verifiedDecryptedData.usedACs.groupAC.should.be.equal(0);
    });

    it('returns the used station signature', function () {
        const verifiedDecryptedData = Crypto.tryDecrypt(log, cachedSED, [cachedAC1, cachedAC2]);
        verifiedDecryptedData.should.have.property('usedACs');
        verifiedDecryptedData.usedACs.should.have.property('stationAC');
        verifiedDecryptedData.usedACs.stationAC.should.be.equal(1);
    });
});