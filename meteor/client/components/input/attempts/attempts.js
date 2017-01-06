Template.attempts.helpers({
    empty_measurement: {read_only: false, strValue: "", class: "add-attempt-input", synced: false},
    scoreWritePermission: function (metadata) {
        Meteor.inputDependency.depend();
        return metadata.write_permission;
    }
});