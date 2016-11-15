const Generic = new Mongo.Collection('Generic');

if (Meteor.isClient) Ground.Collection(Generic);

if (Meteor.isServer) {
    Meteor.publish('Accounts', function () {
        return Generic.find({});
    });
}