import {Server} from "../../../../../imports/api/database/ServerInterface";
import {AccountManager} from "../../../../../imports/api/accountManagement/AccountManager";

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

        Meteor.f7.confirm("Soll der Wettkampf \"" + Server.getContestByID(id).name + "\" wirklich aktiviert werden? Der aktuelle Wettkampf \"" + Server.getCompetitionName() + "\" wird dadurch deaktiviert! Daher müssen alle Ein- und Ausgabegeräte neu mit diesem Server verbunden werden.", "Warnung", function () {
            //const id = event.target.closest(".accordion-item-content").dataset.id;
            Server.activateCompetition(AccountManager.getAdminAccount().account, id);
            });
        },
    'blur .title-input': function (event) {
        Server.renameCompetition(AccountManager.getAdminAccount().account, event.target.dataset.id, event.target.value)
    },
    'click .delete-competition': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        Meteor.f7.confirm("Möchten sie den Wettbewerb wirklich entgültig löschen?", "Wettbewerb löschen", function () {
            Server.removeCompetition(AccountManager.getAdminAccount().account, event.target.closest(".delete-competition").dataset.id);
        });
    }
});