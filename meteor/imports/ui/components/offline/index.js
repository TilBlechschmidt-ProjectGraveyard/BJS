import "./index.html";

Template.offline.helpers({
    isOffline: function () {
        const groupName = FlowRouter.current().route.group.name;
        return !Meteor.status().connected && (groupName == "config" || groupName == "output");
    }
});