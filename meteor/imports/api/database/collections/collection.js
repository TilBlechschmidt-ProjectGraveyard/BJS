export function Collection(name, grounded, nonCompetitionDB, publicationFunction) {
    const col = this;

    col.name = name;


    let handlerObject = {_driver: Meteor.dbHandle};

    if (nonCompetitionDB) {
        if (typeof(nonCompetitionDB) === 'boolean') {
            handlerObject = {};
        } else {
            handlerObject = {_driver: nonCompetitionDB};
        }
    }

    col.handle = new Mongo.Collection(col.name, handlerObject);

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
        const c = function () {
            Meteor.dbReady[col.name] = true;
            if (typeof callback === 'function') callback();
        };
        if (Meteor.isClient && col.grounded && !Meteor.dbReady[col.name]) {
            if (!Meteor.dbReady[col.name]) {
                col.ground.once("loaded", c);
            } else {
                c();
            }
        } else {
            c();
        }
    };
    col.onReady();

    if (Meteor.isClient) {
        Meteor.subscribe(col.name);
    } else {
        col.publish();
    }
}