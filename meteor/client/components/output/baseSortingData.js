import {isReady, isUpdate, isNotReady, isFinish, statusToNumber} from "./helpers";

module.exports = [
    {
        id: 0,
        name: "Urkundenstatus",
        icon: "tags",
        sort: function (a, b) {
            return statusToNumber(a) - statusToNumber(b);
        },
        getGroupName: function (a) {
            if (isReady(a)) return "Bereit";
            if (isUpdate(a)) return "Neu Erstellen";
            if (isNotReady(a)) return "Nicht Bereit";
            if (isFinish(a)) return "Fertig";
        }
    },
    {
        id: 1,
        name: "Urkundentyp",
        icon: "document_text",
        sort: function (a, b) {
            return b.certificate - a.certificate;
        },
        getGroupName: function (a) {
            return a.certificateName;
        }
    },
    {
        id: 2,
        name: "Nachname",
        icon: "person",
        sort: function (a, b) {
            return a.lastName.localeCompare(b.lastName);
        },
        getGroupName: function (a) {
            return "";
        }
    },
    {
        id: 3,
        name: "Vorname",
        icon: "person",
        sort: function (a, b) {
            return a.firstName.localeCompare(b.firstName);
        },
        getGroupName: function (a) {
            return "";
        }
    },
    {
        id: 4,
        name: "Punkte",
        icon: "stopwatch",
        sort: function (a, b) {
            return b.score - a.score;
        },
        getGroupName: function (a) {
            return "";
        }
    },
    {
        id: 5,
        name: "Alter",
        icon: "today",
        sort: function (a, b) {
            return b.ageGroup - a.ageGroup;
        },
        getGroupName: function (a) {
            return a.ageGroup.toString();
        }
    },
    {
        id: 6,
        name: "Gruppe",
        icon: "persons",
        sort: function (a, b) {
            return a.group.localeCompare(b.group);
        },
        getGroupName: function (a) {
            return a.group;
        }
    },
    {
        id: 7,
        name: "Geschlecht",
        icon: "heart",
        sort: function (a, b) {
            return b.isMale - a.isMale;
        },
        getGroupName: function (a) {
            return a.isMale ? "Männlich" : "Weiblich";
        }
    }
];