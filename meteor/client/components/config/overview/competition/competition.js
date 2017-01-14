import {DBInterface} from "../../../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../../../imports/api/account_managment/AccountManager";
Template.competition.events({
    'click .title-input': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
    },
    'click .show-sportTypes': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        Meteor.f7.popup(event.target.dataset.popup);
        return false;
    },
    'click .launch-competition': function (event) {
        const id = event.target.closest(".accordion-item-content").dataset.id;
        DBInterface.activateCompetition(AccountManager.getAdminAccount().account, id);
    }
});