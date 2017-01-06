// import {reloadSwiper} from "../input";
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
        Session.set(event.target.dataset.id, event.target.checked);
        Meteor.inputDependency.changed();
        // reloadSwiper(true);
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