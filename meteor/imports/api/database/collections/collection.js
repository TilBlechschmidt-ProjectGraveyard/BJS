export function Collection(name, grounded, nonCompetitionDB, publicationFunction) {
    const col = this;

    col.name = name;

    col.handle = new Mongo.Collection(col.name, nonCompetitionDB ? {} : {_driver: Meteor.dbHandle});

    col.grounded = grounded;

    col.publish = publicationFunction ? publicationFunction : function () {
            if (Meteor.isServer) {
                Meteor.publish(col.name, function () {
                    return col.handle.find({});
                });
            }
        };

    if (Meteor.isClient && col.grounded) col.ground = Ground.Collection(col.handle);

    col.createMockData = function () {
    };

    if (!Meteor.dbReady) {
        Meteor.dbReady = {};
    }

    Meteor.dbReady[col.name] = false;
    col.onReady = function (callback) {
        if (Meteor.isClient && col.grounded) {
            if (!Meteor.dbReady[col.name]) {
                col.ground.once("loaded", callback);
            } else {
                callback();
            }
        } else {
            callback();
        }
    };
    col.onReady(function () {
        console.log(col.name + " is now connected!");
    });

    if (Meteor.isClient) {
        Meteor.subscribe(col.name);
    } else {
        col.publish();
    }
}