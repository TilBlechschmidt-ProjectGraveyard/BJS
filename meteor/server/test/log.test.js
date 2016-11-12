import {Log} from "../../imports/api/log";
import {chai} from "meteor/practicalmeteor:chai";
chai.should();

describe('log', function () {
    it('writes a message with `error`', function () {
        var l = new Log();

        l.error("Test");

        l.messages.length.should.be.equal(1);
    });

    it('writes a message with `err`', function () {
        var l = new Log();

        console.log(l.err);

        l.err("Test");

        l.messages.length.should.be.equal(1);
    });

    it('writes a message with `warning`', function () {
        var l = new Log();

        l.warning("Test");

        l.messages.length.should.be.equal(1);
    });

    it('writes a message with `warn`', function () {
        var l = new Log();

        l.warn("Test");

        l.messages.length.should.be.equal(1);
    });

    it('writes a message with `info`', function () {
        var l = new Log();

        l.info("Test");

        l.messages.length.should.be.equal(1);
    });
});