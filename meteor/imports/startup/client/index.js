import "../../ui/components/hello";
import "../../ui/components/info";
import "../../ui/components/two_view";
import "../../ui/components/home/left";
import "../../ui/components/home/main";
import "../../ui/components/views/main";
import "../../ui/components/views/left";
import "../../ui/components/sports/left";
import "../../ui/components/sports/main";
import "../../ui/components/views/middle";
import "../../ui/components/views/right";
import "../../ui/components/views/full";
import "../../ui/components/athletes/left";
import "../../ui/components/athletes/middle";
import "../../ui/components/athletes/right";
import "../../ui/components/codes";

// Run things on startup
export function onStartup() {

    console.log('Hi there from the client startup script!');

    import {Meteor} from 'meteor/meteor';
    console.log("sub");
    // let a = Meteor.subscribe("Generic");
    // while (!a.ready()) {console.log("Waiting");}
    import {Generic} from '../../api/database/collections/generic';
    console.log(Generic.handle.find({}).fetch());
    //
    // console.log(a.ready());
    setTimeout(function () {
        // console.log(a.ready());
        console.log(Generic.handle.find({}).fetch());
    }, 2000);
    // const initializeDB = require("../../api/database/collections/initialize");
    // initializeDB();
    // console.log("Client INit");
    // console.log("a" + Generic.handle.find({}).fetch());
    //
    // const dbPrefix = Generic.handle.find({}).fetch()[0].activeContest;
    // Meteor.dbHandle = new MongoInternals.RemoteCollectionDriver(Meteor.config.competitionMongoURL + dbPrefix);
}

