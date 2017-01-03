import "./index.html";

Template.offline.helpers({
    isOffline: function () {
        const time = new Date().getTime();
        const connected = Meteor.status().connected;
        if (Meteor.pageVisitTime + 3000 < time) {
            const groupName = FlowRouter.current().route.group.name;
            return !connected && (groupName == "config" || groupName == "output");
        } else {
            return false;
        }
    }
});