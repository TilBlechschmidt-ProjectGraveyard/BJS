export {Log};


function Log() {
    this.messages = [];
}

Log.prototype = {
    addError: function (message) {
        this.messages.push({
            level: 2,
            message: message,
            timestamp: new Date()
        });
    },
    addWarning: function (message) {
        this.messages.push({
            level: 1,
            message: message,
            timestamp: new Date()
        });
    },
    addInfo: function (message) {
        this.messages.push({
            level: 0,
            message: message,
            timestamp: new Date()
        });
    },
    addCustom: function (level, message) {
        this.messages.push({
            level: level,
            message: message,
            timestamp: new Date()
        });
    },
    merge: function (other) {
        this.messages = this.messages.concat(other.messages);
    },
    getAsString: function () {
        return _.map(this.messages, function (message) {
            return message.timestamp.toLocaleString() + " [" + message.level + "]: " + message.message;
        });
    },
    getAsStringWithLevel: function (level) {
        return _.map(_.where(this.messages, {level: level}), function (message) {
            return message.timestamp.toLocaleString() + " [" + message.level + "]: " + message.message;
        });
    },
    getAsStringWithMinLevel: function (level) {
        return _.map(_.filter(this.messages, function (message) {
            return message.level >= level;
        }), function (message) {
            return message.timestamp.toLocaleString() + " [" + message.level + "]: " + message.message;
        });
    }
};


,
"conversion_factor"
:
{
    "A1"
:
    aaaaaaa,
        "A2"
:
    aaaaaaa,
        "A3"
:
    aaaaaaa,
        "A4"
:
    aaaaaaa,
        "A5"
:
    aaaaaaa,
        "A6"
:
    aaaaaaa,
        "B1"
:
    aaaaaaa,
        "B2"
:
    aaaaaaa,
        "C1"
:
    aaaaaaa,
        "C2"
:
    aaaaaaa,
        "D"
:
    aaaaaaa,
        "E"
:
    aaaaaaa
};;;;;;;;;;;;