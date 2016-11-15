const Athletes = new Mongo.Collection('Athletes');

if (Meteor.isClient) Ground.Collection(Athletes);

if (Meteor.isServer) {
    Meteor.publish('Athletes', function () {
        return Athletes.find({});
    });
}