import {DBInterface} from "../../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../../imports/api/account_managment/AccountManager";

let log = new ReactiveVar([]);

Template.logPopup.events({
    'popup:open .popup-log': function () {
        DBInterface.getLog(AccountManager.getAdminAccount().account, function (data) {
            log.set(data);
        });
    }
});

Template.logPopupContent.helpers({
    getLog: function () {
        return log.get();
    }
});