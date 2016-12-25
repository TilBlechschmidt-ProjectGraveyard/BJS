/**
 * Created by empty on 17-Nov-16.
 */
import {Template} from "meteor/templating";
import "./index.html";
import {twoView} from "./../../two_view/index.js";
import {COMPETITION_TYPES} from "../../../../api/logic/competition_type";

export let myapp = new Framework7();

let comp_types = [];
for (let competition_type in COMPETITION_TYPES) {
    comp_types[competition_type]=COMPETITION_TYPES[competition_type].object.getInformation().name;
}


//log.getAsString();


let mypicker = myapp.picker({
    input: '#pick-comp_type',
    cols: [{
        values: comp_types,
        textAlign: 'center'
    }],
    onChange: function(picker,values,displayValues) {
        document.getElementById('pick-comp_type').value = displayValues;


        Meteor.subscribe("Generic");
        Meteor.subscribe("Athletes");

        import {getAthletesOfAccounts} from "../../../../api/database/db_access";
        import {Log} from "../../../../api/log";
        import {Account} from "../../../../api/logic/account";
        import {generateAC} from "../../../../api/crypto/crypto";

        const groupAccount = new Account(['Q#z'], [], generateAC('1234567ljhfaljawf8', 'pepper'));
        const log = new Log();
        let a_comp_types = _.map(getAthletesOfAccounts(log, [groupAccount], false), function (athlete) {
            return athlete.getFullName();
        });
        console.log(a_comp_types);
        console.log(log.getAsString());
        document.getElementById('link_next').innerHTML = "Bla";
    }
});


Template.home_main.events({
    'click #pick-comp_type'(event, instance) {
        // increment the counter when button is clicked
        mypicker.open();
    },
});

Template.home_main.events({
    'click #link_next' (event, instance) {
        FlowRouter.go('/config/sports');
    },
});