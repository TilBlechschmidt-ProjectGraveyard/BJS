Template.attempts.helpers({
    empty_measurement: function (metadata) {
        return {
            inputType: metadata.unit === "min:s" ? "text" : "number",
            read_only: false,
            strValue: "",
            class: "add-attempt-input",
            synced: false
        }
    },
    canAddAttempt: function (metadata, measurements) {
        const maxAttempts = metadata.maxAttempts !== undefined ? metadata.maxAttempts : 3;
        console.log("maxAttempts: " + maxAttempts + "; melen: " + measurements.length);
        return metadata.write_permission &&
            (measurements.length < maxAttempts || maxAttempts == -1);
    }
});