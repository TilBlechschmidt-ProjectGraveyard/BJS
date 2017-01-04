import {Template} from "meteor/templating";
import "./index.html";
import "./index.css";
import "../../../layouts/views.css";
import {NewCompetition} from "../new_competition_helpers";
import {genRandomCode} from "../../../../api/crypto/pwdgen";
import {Account} from "../../../../api/logic/account";
import {Crypto} from "../../../../api/crypto/crypto";

let loginStations = [];
let loginGroups = [];
let loginCustom = [];

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
        return loginStations;
    },
    login_groups: function () {
        _login_tracker.depend();
        return loginGroups;
    },
    login_custom: function () {
        _login_tracker.depend();
        const ct = NewCompetition.getCompetitionType();
        return _.map(loginCustom, function (accountObject) {
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
        loginStations = [];
        loginGroups = [];
        FlowRouter.go('/config/athletes');
    },
    'click #link_start' (event, instance) {
        if (loginGroups.length != Meteor.groups.length) {
            Meteor.f7.alert("Sie müssen erst Zugangscodes automatisch erstellen.", "Hinweiß");
            return;
        }

        //TODO maybe option to reset password and remove confirms
        Meteor.f7.confirm('Nach dem Starten könne keine Änderungen mehr vorgenommen werden. Der neue Wettkampf wird automatisch aktiviert.', 'BJS starten', function () {
            Meteor.f7.confirm('Haben Sie alle Zugangscodes am Besten zwei mal gespeichert? Dafür kann man diese Ausdrucken, als PDF speichern oder abschreiben.', 'BJS starten', function () {
                Meteor.f7.confirm('Nach dem Starten können die Zugangscodes nicht erneut angezeigt werden. Stellen Sie sicher, dass Sie ohne "RunItEasy" Zugriff auf die Zugangscodes haben. Ansonsten müssen Sie einen neuen Wettkampf einrichten!', 'BJS starten', function () {
                    Meteor.f7.confirm('Jetzt starten?', 'BJS starten', function () {
                        const accounts = _.map(loginGroups.concat(loginStations).concat(loginCustom), function (obj) {
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
        console.log("SAVE PDF", loginStations);
        Blaze.saveAsPDF(Template.codes_print, {
            filename: "ZugangscodesBJS.pdf",
            data: {
                competition_name: NewCompetition.getName(),
                login_stations: loginStations,
                login_groups: loginGroups,
                login_custom: loginCustom
            },
        });
    },
    'click #btn-new-codes' (event, instance) {
        setInputDisabled(true);

        // Load UI elements
        const progressBar = document.getElementById("progress-bar");
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
        loginGroups = [];
        loginStations = [];
        progressText.innerHTML = "0/" + accountNumber;
        Meteor.f7.setProgressbar("#progress-bar", 100);//TODO not working
        _login_tracker.changed();

        let counter = 0;

        const generateNextGroupLogin = function () {
            const groupID = counter - sportTypes.length;
            if (groupID < Meteor.groups.length) {
                const password = genRandomCode();

                const account = new Account(Meteor.groups[groupID].name, [Meteor.groups[groupID].name], [], Crypto.generateAC(password));

                loginGroups.push({
                    password: password,
                    account: account
                });
                Meteor.groups[groupID].account = account;

                counter++;
                _login_tracker.changed();
                progressText.innerHTML = counter + "/" + accountNumber; //TODO add progress bar

                setTimeout(generateNextGroupLogin, 0);
            } else if (groupID == Meteor.groups.length) {
                const certificatePassword = genRandomCode();

                const certificateAccount = new Account("Urkunden", [], [], Crypto.generateAC(certificatePassword), true);

                loginStations.push({
                    password: certificatePassword,
                    account: certificateAccount
                });

                counter++;
                _login_tracker.changed();
                progressText.innerHTML = counter + "/" + accountNumber; //TODO add progress bar


                setTimeout(generateNextGroupLogin, 0);
            } else {
                setInputDisabled(false);
            }
        };

        const generateNextStationLogin = function () {
            if (counter < sportTypes.length) {
                const password = genRandomCode();

                loginStations.push({
                    password: password,
                    account: new Account(sportTypes[counter].name, [], [sportTypes[counter].stID], Crypto.generateAC(password))
                });

                counter++;
                _login_tracker.changed();
                progressText.innerHTML = counter + "/" + accountNumber; //TODO add progress bar

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

        loginCustom.push({
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

        loginCustom[accountIndex].account.group_permissions = [];

        for (let sportTypeIndex in all_sport_types) {
            let stID = all_sport_types[sportTypeIndex].stID;
            let checkbox = document.getElementById("custom-select-" + stID + "-" + accountIndex);
            if (checkbox) {
                if (checkbox.checked) {
                    loginCustom[accountIndex].account.group_permissions.push(stID);
                }
            }
        }
        let certificateCheckbox = document.getElementById("custom-select-certificate-" + accountIndex);

        loginCustom[accountIndex].account.canViewResults = (certificateCheckbox && certificateCheckbox.checked);
    },
    'click .btn-remove-account' (event, instance) {
        let accountIndex = event.target.closest(".btn-remove-account").dataset.account_index;
        loginCustom.splice(accountIndex, 1);
        _login_tracker.changed();
    },
    'input .in-custom-name' (event, instance) {
        let accountIndex = event.target.dataset.account_index;
        loginCustom[accountIndex].account.name = event.target.value;
        _login_tracker.changed();
    }
});

Template.codes_print.helpers({
    hasData: function (obj) {
        return Object.keys(obj).length > 0;
    }
});