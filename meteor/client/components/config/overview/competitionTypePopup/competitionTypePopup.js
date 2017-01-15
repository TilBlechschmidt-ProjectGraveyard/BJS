import {COMPETITION_TYPES} from "../../../../../imports/api/logic/competition_type";
import {DBInterface} from "../../../../../imports/api/database/DBInterface";
import {AccountManager} from "../../../../../imports/api/account_managment/AccountManager";
Template.competitionTypeCreatePopupContent.helpers({
    competitionTypes: function () {
        return COMPETITION_TYPES;
    }
});

Template.competitionTypeCreatePopupContent.events({
    'keypress .competitionNameInput': function (event) {
        if (event.keyCode == 13) {
            const submitButton = event.target.closest("div.swipeout-actions-right").querySelector(".addCompetitionSubmit");
            submitButton.click();
        }
    },
    'click .addCompetition': function (event) {
        const swipeout = event.target.closest("li.swipeout");
        const input = swipeout.querySelector("input");
        input.value = "";
        Meteor.f7.swipeoutOpen(swipeout, undefined, function () {
            input.focus();
        });
    },
    'click .addCompetitionSubmit': function (event) {
        const swipeout = event.target.closest("li.swipeout");
        const name = swipeout.querySelector("input").value;
        let id = swipeout.dataset.id;
        for (const ct in COMPETITION_TYPES) {
            if (!COMPETITION_TYPES.hasOwnProperty(ct)) continue;
            if (COMPETITION_TYPES[ct].id == id) {
                id = parseInt(ct);
                break;
            }
        }

        DBInterface.addCompetition(AccountManager.getAdminAccount().account, name, id);
        Meteor.f7.closeModal(".popup-competitionType");
    }
});