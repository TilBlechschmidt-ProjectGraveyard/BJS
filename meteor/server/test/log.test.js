import {Log} from '../../imports/api/log';
import {chai} from 'meteor/practicalmeteor:chai';
chai.should();

describe('log', function () {
    it('writes a message with `error`', function () {
        const l = new Log();

        l.error('Test');

        l.messages.length.should.be.equal(1);
    });

    it('writes a message with `err`', function () {
        const l = new Log();

        l.err('Test');

        l.messages.length.should.be.equal(1);
    });

    it('writes a message with `warning`', function () {
        const l = new Log();

        l.warning('Test');

        l.messages.length.should.be.equal(1);
    });

    it('writes a message with `warn`', function () {
        const l = new Log();

        l.warn('Test');

        l.messages.length.should.be.equal(1);
    });

    it('writes a message with `info`', function () {
        const l = new Log();

        l.info('Test');

        l.messages.length.should.be.equal(1);
    });
});