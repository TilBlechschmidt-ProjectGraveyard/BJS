export function Collection(name, publicationFunction) {
    const col = this;

    col.name = name;
    col.handle = new Mongo.Collection(col.name, {});

    col.publish = publicationFunction ? publicationFunction : function (name, handle) {
            Meteor.publish(name, function () {
                return handle.find({}, {});
            });
        };


    if (Meteor.isClient) col.ground = Ground.Collection(col.handle);

    col.createMockData = function () {
    };

    if (!Meteor.dbReady) {
        Meteor.dbReady = {};
    }


    Meteor.dbReady[col.name] = false;

    col.isReady = function () {
        return Meteor.isServer || Meteor.dbReady[col.name];
    };

    col.onReady = function (callback) {
        const c = function () {
            Meteor.dbReady[col.name] = true;
            if (typeof callback === 'function') callback();
        };
        if (Meteor.isClient && !Meteor.dbReady[col.name]) {
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
        col.publish(col.name, col.handle);
    }
}

export function ContestCollection(name, publicationFunction) {
    const col = this;

    col.basename = name;

    col.handles = {};

    col.handle = undefined;
    col.ground = undefined;

    col.createMockData = function () {
    };

    if (!Meteor.dbReady) {
        Meteor.dbReady = {};
    }
    Meteor.dbReady[col.basename] = false;

    col.isReady = function () {
        return Meteor.isServer || Meteor.dbReady[col.basename];
    };

    col.onReady = function (callback) {
        const c = function () {
            Meteor.dbReady[col.basename] = true;
            if (typeof callback === 'function') callback();
        };
        if (Meteor.isClient && !Meteor.dbReady[col.basename]) {
            if (!Meteor.dbReady[col.basename]) {
                col.ground.once("loaded", c);
            } else {
                c();
            }
        } else {
            c();
        }
    };

    col.publish = publicationFunction ? publicationFunction : function (name, handle) {
            Meteor.publish(col.name, function () {
                return handle.find({});
            });
        };

    col.connect = function (competition_name) {
        Meteor.dbReady[col.basename] = false;
        let competition_name_without_whitespaces = competition_name.replace(/ /g, '');
        let name = competition_name_without_whitespaces + "_" + col.basename;

        // let dbHandle = new MongoInternals.RemoteCollectionDriver(Meteor.config.competitionMongoURL + competition_name_without_whitespaces);
        // let handle = new Mongo.Collection(name, {_driver: dbHandle});
        let handle = new Mongo.Collection(name, {});

        if (Meteor.isClient) col.ground = Ground.Collection(handle);

        if (Meteor.isClient) {
            col.handle = handle;
            Meteor.subscribe(name);
        } else {
            col.handles[competition_name] = handle;
            col.publish(name, handle);
        }

        col.onReady(function () {
        });
    };

    col.switch = function (competitionID) {
        if (Meteor.isServer) {
            console.log("SWITCH", competitionID);
            col.name = competitionID + "_" + col.basename;
            col.handle = col.handles[competitionID];
        }
    };
}