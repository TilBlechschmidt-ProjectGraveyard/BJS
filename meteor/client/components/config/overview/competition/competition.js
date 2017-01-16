import {Server} from "../../../../../imports/api/database/ServerInterface";
import {AccountManager} from "../../../../../imports/api/accountManagement/AccountManager";

Template.contest.events({
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
    'click .launch-contest': function (event) {
        const id = event.target.closest(".accordion-item-content").dataset.id;

        Meteor.f7.confirm("Soll der Wettkampf \"" + Server.contest.get(id).name + "\" wirklich aktiviert werden? Der aktuelle Wettkampf \"" + Server.contest.get().name + "\" wird dadurch deaktiviert! Daher müssen alle Ein- und Ausgabegeräte neu mit diesem Server verbunden werden.", "Warnung", function () {
            //const id = event.target.closest(".accordion-item-content").dataset.id;
            Server.contest.activate(AccountManager.getAdminAccount().account, id);
            });
        },
    'blur .title-input': function (event) {
        Server.contest.rename(AccountManager.getAdminAccount().account, event.target.dataset.id, event.target.value)
    },
    'click .delete-contest': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        Meteor.f7.confirm("Möchten sie den Wettbewerb wirklich entgültig löschen?", "Wettbewerb löschen", function () {
            Server.contest.remove(AccountManager.getAdminAccount().account, event.target.closest(".delete-contest").dataset.id);
        });
    }
});