import {Template} from "meteor/templating";
import "./index.html";
import "./index.css";
import "../../../layouts/views.css";
import {NewCompetition} from "../new_competition_helpers";
import {genRandomCode} from "../../../../api/crypto/pwdgen";
import {Account} from "../../../../api/logic/account";
import {Crypto} from "../../../../api/crypto/crypto";

let _login_tracker = new Tracker.Dependency();

function setInputDisabled(state) {
    if (state === true) state = "true";
    const buttons = document.getElementsByClassName("button");
    for (let button in buttons) {
        if (!buttons.hasOwnProperty(button)) continue;
        button = buttons[button];
        if (state) button.setAttribute("disabled", state);
        else button.removeAttribute("disabled");
    }

    const links = document.getElementsByClassName("item-link");
    for (let link in links) {
        if (!links.hasOwnProperty(link)) continue;
        link = links[link];
        if (state) link.setAttribute("disabled", state);
        else link.removeAttribute("disabled");
    }
}

//noinspection JSUnusedGlobalSymbols
Template.codes.helpers({
    get_competition_name: function () {
        return NewCompetition.getName();
    },
    login_stations: function () {
        _login_tracker.depend();
        return Meteor.loginStations;
    },
    login_groups: function () {
        _login_tracker.depend();
        return Meteor.loginGroups;
    },
    login_custom: function () {
        _login_tracker.depend();
        const ct = NewCompetition.getCompetitionType();
        return _.map(Meteor.loginCustom, function (accountObject) {
            accountObject.sports = _.map(
                _.filter(NewCompetition.getSports(), function (sportTypeObj) {
                    return sportTypeObj.activated;
                }), function (sportTypeObj) {
                    let stID = sportTypeObj.stID;
                    return {
                        stID: stID,
                        name: ct.getNameOfSportType(stID),
                        checked: ""
                    };
                }
            );

            const score_write_permissions = accountObject.account.score_write_permissions;


            for (let stIDIndex in score_write_permissions) {
                if (!score_write_permissions.hasOwnProperty(stIDIndex)) continue;
                for (let sportObjectIndex in accountObject.sports) {
                    if (!accountObject.sports.hasOwnProperty(sportObjectIndex)) continue;
                    if (score_write_permissions[stIDIndex] === accountObject.sports[sportObjectIndex].stID) {
                        accountObject.sports[sportObjectIndex].checked = "checked";
                        break;
                    }
                }
            }

            return accountObject;
        });
    }
});

//noinspection JSUnusedLocalSymbols
Template.codes.events({
    'click #link_back' (event,instance) {
        if (Meteor.loginGroups.length > 0 || Meteor.loginStations.length > 0) {
            Meteor.f7.confirm("Wenn Sie diese Seite verlassen werden die automatisch erstellten Zugangscodes gelöscht. Wollen Sie fortfahren?", "Zurück", function () {
                Meteor.loginStations = [];
                Meteor.loginGroups = [];
                FlowRouter.go('/config/athletes');
            });
        } else {
            Meteor.loginStations = [];
            Meteor.loginGroups = [];
            FlowRouter.go('/config/athletes');
        }

    },
    'click #link_start' (event, instance) {
        if (Meteor.loginGroups.length != Meteor.groups.length) {
            Meteor.f7.alert("Sie müssen erst Zugangscodes automatisch erstellen.", "Hinweiß");
            return;
        }

        //TODO maybe option to reset password and remove confirms
        Meteor.f7.confirm('Nach dem Starten könne keine Änderungen mehr vorgenommen werden. Der neue Wettkampf wird automatisch aktiviert.', 'BJS starten', function () {
            Meteor.f7.confirm('Haben Sie alle Zugangscodes am Besten zwei mal gespeichert? Dafür kann man diese Ausdrucken, als PDF speichern oder abschreiben.', 'BJS starten', function () {
                Meteor.f7.confirm('Nach dem Starten können die Zugangscodes nicht erneut angezeigt werden. Stellen Sie sicher, dass Sie ohne "RunItEasy" Zugriff auf die Zugangscodes haben. Ansonsten müssen Sie einen neuen Wettkampf einrichten!', 'BJS starten', function () {
                    Meteor.f7.confirm('Jetzt starten?', 'BJS starten', function () {
                        const accounts = _.map(Meteor.loginGroups.concat(Meteor.loginStations).concat(Meteor.loginCustom), function (obj) {
                            return obj.account;
                        });

                        NewCompetition.save(accounts);

                        FlowRouter.go('/config');
                    });
                });
            });
        });
    },
    'click #btn-print' (event, instance) {
        window.print();
    },
    'click #btn-pdf' (event, instance) {
        console.log("SAVE PDF", Meteor.loginStations);
        Blaze.saveAsPDF(Template.codes_print, {
            filename: "ZugangscodesBJS.pdf",
            data: {
                competition_name: NewCompetition.getName(),
                login_stations: Meteor.loginStations,
                login_groups: Meteor.loginGroups,
                login_custom: Meteor.loginCustom
            },
        });
    },
    'click #btn-new-codes' (event, instance) {
        setInputDisabled(true);
        Meteor.f7.showProgressbar("#code-generation-progress");

        // Load UI elements
        const progressBar = document.getElementById("code-generation-progress");
        const progressText = document.getElementById("progress-text");


        //load data
        const ct = NewCompetition.getCompetitionType();

        const sportTypes = _.map(_.filter(NewCompetition.getSports(), function (obj) {
            return obj.activated;
        }), function (obj) {
            return {
                stID: obj.stID,
                name: ct.getNameOfSportType(obj.stID)
            };
        });

        const accountNumber = Meteor.groups.length + sportTypes.length + 1;

        //Delete old passwords
        Meteor.loginGroups = [];
        Meteor.loginStations = [];
        progressText.innerHTML = "0/" + accountNumber;
        Meteor.f7.setProgressbar("#code-generation-progress", 0, 100);
        _login_tracker.changed();

        let counter = 0;

        const generateNextGroupLogin = function () {
            const groupID = counter - sportTypes.length;
            if (groupID < Meteor.groups.length) {
                const password = genRandomCode();

                const account = new Account(Meteor.groups[groupID].name, [Meteor.groups[groupID].name], [], Crypto.generateAC(password));

                Meteor.loginGroups.push({
                    password: password,
                    account: account
                });
                Meteor.groups[groupID].account = account;

                counter++;
                _login_tracker.changed();
                progressText.innerHTML = counter + "/" + accountNumber;
                Meteor.f7.setProgressbar("#code-generation-progress", counter / accountNumber * 100, 100);

                setTimeout(generateNextGroupLogin, 0);
            } else if (groupID == Meteor.groups.length) {
                const certificatePassword = genRandomCode();

                const certificateAccount = new Account("Urkunden", [], [], Crypto.generateAC(certificatePassword), true);

                Meteor.loginStations.push({
                    password: certificatePassword,
                    account: certificateAccount
                });

                counter++;
                _login_tracker.changed();
                progressText.innerHTML = counter + "/" + accountNumber;
                Meteor.f7.setProgressbar("#code-generation-progress", counter / accountNumber * 100, 100);

                setTimeout(generateNextGroupLogin, 0);
            } else {
                setInputDisabled(false);
            }
        };

        const generateNextStationLogin = function () {
            if (counter < sportTypes.length) {
                const password = genRandomCode();

                Meteor.loginStations.push({
                    password: password,
                    account: new Account(sportTypes[counter].name, [], [sportTypes[counter].stID], Crypto.generateAC(password))
                });

                counter++;
                _login_tracker.changed();
                progressText.innerHTML = counter + "/" + accountNumber;
                Meteor.f7.setProgressbar("#code-generation-progress", counter / accountNumber * 100, 100);

                setTimeout(generateNextStationLogin, 0);
            } else {
                generateNextGroupLogin();
            }
        };

        generateNextStationLogin();
    },
    'click #btn-add-account' (event, instance) {
        const password = genRandomCode();
        const account = new Account('Unbenannt', [], [], Crypto.generateAC(password));

        Meteor.loginCustom.push({
            password: password,
            account: account
        });
        _login_tracker.changed();

    },
    'change .permission-input' (event, instance) {
        let accountIndex = event.target.dataset.account_index;
        const all_sport_types = _.filter(NewCompetition.getSports(), function (sportTypeObj) {
            return sportTypeObj.activated;
        });

        Meteor.loginCustom[accountIndex].account.group_permissions = [];

        for (let sportTypeIndex in all_sport_types) {
            let stID = all_sport_types[sportTypeIndex].stID;
            let checkbox = document.getElementById("custom-select-" + stID + "-" + accountIndex);
            if (checkbox) {
                if (checkbox.checked) {
                    Meteor.loginCustom[accountIndex].account.group_permissions.push(stID);
                }
            }
        }
        let certificateCheckbox = document.getElementById("custom-select-certificate-" + accountIndex);

        Meteor.loginCustom[accountIndex].account.canViewResults = (certificateCheckbox && certificateCheckbox.checked);
    },
    'click .btn-remove-account' (event, instance) {
        let accountIndex = event.target.closest(".btn-remove-account").dataset.account_index;
        Meteor.loginCustom.splice(accountIndex, 1);
        _login_tracker.changed();
    },
    'input .in-custom-name' (event, instance) {
        let accountIndex = event.target.dataset.account_index;
        Meteor.loginCustom[accountIndex].account.name = event.target.value;
        _login_tracker.changed();
    },
    'click .accordion-item': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        Meteor.f7.accordionToggle(event.target.closest(".accordion-item"));
        return false;
    },
});

Template.codes_print.onRendered(function () {
    window.onbeforeunload = function () {
        return confirm("Wenn Sie die Konfigurationsseite verlassen, gehen alle nicht gespeicherten Eingaben verloren! Wollen Sie fortfahren?");
    };
});