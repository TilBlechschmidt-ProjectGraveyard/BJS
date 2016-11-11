export {Log};

/**
 * A logging object to save errors, warnings and other messages for the user.
 * @constructor
 */
function Log() {
    this.messages = [];
}

Log.prototype = {
    /**
     * Adds a new error.
     * @param {string} message
     */
    addError: function (message) {
        this.messages.push({
            level: 2,
            message: message,
            timestamp: new Date()
        });
    },
    /**
     * Adds a new warning.
     * @param {string} message
     */
    addWarning: function (message) {
        this.messages.push({
            level: 1,
            message: message,
            timestamp: new Date()
        });
    },
    /**
     * Adds a new info message.
     * @param {string} message
     */
    addInfo: function (message) {
        this.messages.push({
            level: 0,
            message: message,
            timestamp: new Date()
        });
    },
    /**
     * Adds a new message with a custom level.
     * @param {number} level
     * @param {string} message
     */
    addCustom: function (level, message) {
        this.messages.push({
            level: level,
            message: message,
            timestamp: new Date()
        });
    },
    /**
     * Merge another Log objects messages to this.messages.
     * @param other
     */
    merge: function (other) {
        this.messages = this.messages.concat(other.messages);
    },
    /**
     * Returns all messages as strings.
     * @returns {Array}
     */
    getAsString: function () {
        return _.map(this.messages, function (message) {
            return message.timestamp.toLocaleString() + " [" + message.level + "]: " + message.message;
        });
    },
    /**
     * Returns all messages with the given level as strings.
     * @param level
     * @returns {Array}
     */
    getAsStringWithLevel: function (level) {
        return _.map(_.where(this.messages, {level: level}), function (message) {
            return message.timestamp.toLocaleString() + " [" + message.level + "]: " + message.message;
        });
    },
    /**
     * Returns all messages with the given or higher level as strings.
     * @param level
     * @returns {Array}
     */
    getAsStringWithMinLevel: function (level) {
        return _.map(_.filter(this.messages, function (message) {
            return message.level >= level;
        }), function (message) {
            return message.timestamp.toLocaleString() + " [" + message.level + "]: " + message.message;
        });
    }
};