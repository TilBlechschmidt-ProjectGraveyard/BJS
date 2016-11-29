export function Collection(name, grounded, nonCompetitionDB) {
    const col = this;

    col.name = name;

    col.handle = new Mongo.Collection(col.name, nonCompetitionDB ? {} : {_driver: Meteor.dbHandle});

    col.grounded = grounded;

    col.createMockData = function () {
    };

    if (Meteor.isClient && col.grounded) Ground.Collection(col.handle);

    if (Meteor.isServer) {
        Meteor.publish(col.name, function () {
            return col.handle.find({});
        });
    }
}