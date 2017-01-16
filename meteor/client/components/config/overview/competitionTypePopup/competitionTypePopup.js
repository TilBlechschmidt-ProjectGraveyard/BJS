import {CONTEST_TYPES} from "../../../../../imports/api/logic/contestType";
import {Server} from "../../../../../imports/api/database/ServerInterface";
import {AccountManager} from "../../../../../imports/api/accountManagement/AccountManager";
Template.contestTypeCreatePopupContent.helpers({
    contestTypes: function () {
        return CONTEST_TYPES;
    }
});

Template.contestTypeCreatePopupContent.events({
    'keypress .contestNameInput': function (event) {
        if (event.keyCode == 13) {
            const submitButton = event.target.closest("div.swipeout-actions-right").querySelector(".addContestSubmit");
            submitButton.click();
        }
    },
    'click .addContest': function (event) {
        const swipeout = event.target.closest("li.swipeout");
        const input = swipeout.querySelector("input");
        input.value = "";
        Meteor.f7.swipeoutOpen(swipeout, undefined, function () {
            input.focus();
        });
    },
    'click .addContestSubmit': function (event) {
        const swipeout = event.target.closest("li.swipeout");
        const name = swipeout.querySelector("input").value;
        let id = swipeout.dataset.id;
        for (const ct in CONTEST_TYPES) {
            if (!CONTEST_TYPES.hasOwnProperty(ct)) continue;
            if (CONTEST_TYPES[ct].id == id) {
                id = parseInt(ct);
                break;
            }
        }

        Server.contest.add(AccountManager.getAdminAccount().account, name, id);
        Meteor.f7.closeModal(".popup-contestType");
    }
});