export function Collection(name, grounded, nonCompetitionDB, publicationFunction) {
    const col = this;

    col.name = name;

    col.handle = new Mongo.Collection(col.name, nonCompetitionDB ? {} : {_driver: Meteor.dbHandle});
    console.log(nonCompetitionDB ? {} : {_driver: Meteor.dbHandle});

    col.grounded = grounded;

    col.createMockData = function () {
    };

    col.publish = publicationFunction ? publicationFunction : function () {
            if (Meteor.isServer) {
                Meteor.publish(col.name, function () {
                    return col.handle.find({});
                });
            }
        };

    if (Meteor.isClient && col.grounded) Ground.Collection(col.handle);

    if (Meteor.isClient) {
        Meteor.subscribe(col.name);
    } else {
        col.publish();
    }
}