const Accounts = new Mongo.Collection('Accounts');

if (Meteor.isClient) Ground.Collection(Accounts);

if (Meteor.isServer) {
    Meteor.publish('Accounts', function () {
        return Accounts.find({});
    });
}