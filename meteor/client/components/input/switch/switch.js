
const defaultSettings = {
    showMale: true,
    showFemale: true,
    groupBySex: false
};

Template.settingSwitch.helpers({
    getState: function (id) {
        let state = Session.get(id);
        if (state === undefined)
            state = defaultSettings[id];
        return state;
    }
});

Template.settingSwitch.events({
    'click .setting-checkbox': function (event) {
        const label = event.target.closest("label");
        const checkbox = label.querySelector("input[type='checkbox']");
        const newValue = !checkbox.checked;

        Session.set(label.dataset.id, newValue);
        Meteor.inputDependency.changed();
    }
});

// Set default options if not set
Template.settingSwitch.onRendered(function () {
    for (let id in defaultSettings) {
        if (!defaultSettings.hasOwnProperty(id)) continue;
        if (Session.get(id) === undefined) {
            Session.set(id, defaultSettings[id]);
            Meteor.inputDependency.changed();
        }
    }
});