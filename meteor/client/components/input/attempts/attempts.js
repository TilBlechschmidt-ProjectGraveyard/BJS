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
    scoreWritePermission: function (metadata) {
        return metadata.write_permission;
    }
});