export {Log};

/**
 * @summary A logging object to save errors, warnings and other messages for the user.
 * @constructor
 */
function Log() {
    this.messages = [];
}

Log.prototype = {

    /**
     * @summary Adds a new error.
     * @param message {string} content of the message
     */
    error: function (message) {
        this.messages.push({
            level: 2,
            message: message,
            timestamp: new Date()
        });
    },
    err: function (message) {
        this.error(message);
    },

    /**
     * @summary Adds a new warning.
     * @param message {string} content of the message
     */
    warning: function (message) {
        this.messages.push({
            level: 1,
            message: message,
            timestamp: new Date()
        });
    },
    warn: function (message) {
        this.warning(message);
    },

    /**
     * @summary Adds a new info message.
     * @param message {string} content of the message
     */
    info: function (message) {
        this.messages.push({
            level: 0,
            message: message,
            timestamp: new Date()
        });
    },

    /**
     * @summary Adds a new message with a custom level.
     * @param level {number} custom log-level to use for the message
     * @param message {string} content of the message
     */
    custom: function (level, message) {
        this.messages.push({
            level: level,
            message: message,
            timestamp: new Date()
        });
    },

    /**
     * @summary Merge another Log objects messages to this.messages.
     * @param other {Log} other Log object this should be merged onto
     */
    merge: function (other) {
        this.messages = this.messages.concat(other.messages);
    },

    /**
     * @summary Clears the messages buffer
     */
    clear: function () {
        this.messages = [];
    },

    /**
     * @summary Returns all messages as strings.
     * @returns {string[]}
     */
    getAsString: function () {
        return _.map(this.messages, function (message) {
            return message.timestamp.toLocaleString() + ' [' + message.level + ']: ' + message.message;
        });
    },

    /**
     * @summary Returns all messages with the given level as strings.
     * @param level
     * @returns {string[]}
     */
    getAsStringWithLevel: function (level) {
        return _.map(_.where(this.messages, {level: level}), function (message) {
            return message.timestamp.toLocaleString() + ' [' + message.level + ']: ' + message.message;
        });
    },

    /**
     * @summary Returns all messages with the given or higher level as strings.
     * @param level
     * @returns {string[]}
     */
    getAsStringWithMinLevel: function (level) {
        return _.map(_.filter(this.messages, function (message) {
            return message.level >= level;
        }), function (message) {
            return message.timestamp.toLocaleString() + ' [' + message.level + ']: ' + message.message;
        });
    }
};