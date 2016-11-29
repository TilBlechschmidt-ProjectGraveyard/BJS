import {Generic} from './generic';

module.exports = function () {
    const dbPrefix = Generic.handle.find({}).fetch()[0].activeContest;
    Meteor.dbHandle = new MongoInternals.RemoteCollectionDriver(Meteor.config.competitionMongoURL + dbPrefix);
};