import {Template} from "meteor/templating";
import "./index.html";
import {COMPETITION_TYPES} from "../../../../../api/logic/competition_type";
import {DBInterface} from "../../../../../api/database/db_access";
import {Log} from "../../../../../api/log";
import {Account} from "../../../../../api/logic/account";
import {Crypto} from "../../../../../api/crypto/crypto";


export let home_main_onLoad = function () {
    let comp_types = [];
    for (let competition_type in COMPETITION_TYPES) {
        comp_types[competition_type] = COMPETITION_TYPES[competition_type].object.getInformation().name;
    }

    let mypicker = Meteor.f7.picker({
        input: '#pick-comp_type',
        cols: [{
            values: comp_types,
            textAlign: 'center'
        }],
        onChange: function (picker, values, displayValues) {
            document.getElementById('pick-comp_type').value = [displayValues];
            DBInterface.setCompetitionTypeID(picker.cols[0].activeIndex);
        }
    });

    DBInterface.waitForReady(function () {
        console.log(comp_types[DBInterface.getCompetitionTypeID()] + " <- This is a TODO in ./meteor/imports/ui/components/config/home/main/index.js"); //TODO set value of picker
        const groupAccount = new Account(['Q#z'], [], Crypto.generateAC('1234567ljhfaljawf8', 'pepper'));
        const log = new Log();
        let data = _.map(DBInterface.getAthletesOfAccounts(log, [groupAccount], false), function (athlete) {
            return athlete.getFullName();
        });
        console.log(data);
    });

    Template.home_main.events({
        'click #pick-comp_type'(event, instance) {
            // increment the counter when button is clicked
            mypicker.open();
        },
        'click #link_next' (event, instance) {
            FlowRouter.go('/config/sports');
        }
    });
};