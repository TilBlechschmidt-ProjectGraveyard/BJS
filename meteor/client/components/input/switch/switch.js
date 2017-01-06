Template.settingSwitch.events({
    'click .setting-checkbox': function (event) {
        console.log("Setting updated (TODO: Store this somewhere and use it): ", event.target.dataset.id, event.target.checked);
    }
});