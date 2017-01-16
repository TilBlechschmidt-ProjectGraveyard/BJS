import {Server} from "../../../../imports/api/database/ServerInterface";
import {AccountManager} from "../../../../imports/api/accountManagement/AccountManager";

let log = new ReactiveVar([]);

Template.logPopup.events({
    'popup:open .popup-log': function () {
        Server.getLog(AccountManager.getAdminAccount().account, function (data) {
            log.set(data);
        });
    }
});

Template.logPopupContent.helpers({
    getLog: function () {
        return log.get();
    }
});