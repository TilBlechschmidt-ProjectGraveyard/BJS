export function Collection(name, publicationFunction) {
    const col = this;

    col.name = name;
    col.handle = new Mongo.Collection(col.name, {});

    col.publish = publicationFunction ? publicationFunction : function () {
            if (Meteor.isServer) {
                Meteor.publish(col.name, function () {
                    return col.handle.find({});
                });
            }
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
        col.publish();
    }
}

export function ContestCollection(name, publicationFunction) {
    console.log("created " + name);

    const col = this;

    col.basename = name;
    col.grounded = true;

    col.handles = {};
    col.grounds = {};

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

    col.connect = function (competition_name) {
        Meteor.dbReady[col.basename] = false;
        col.name = competition_name.replace(/ /g, '') + "_" + col.basename;
        console.log("connectiong to " + col.name);

        let handle = new Mongo.Collection(col.name, {});

        if (Meteor.isClient) col.ground = Ground.Collection(handle);

        col.onReady(function () {
            console.log(col.name + " is ready");
        });

        if (Meteor.isClient) {
            col.handle = handle;
            Meteor.subscribe(col.name);
        } else {
            col.handles[competition_name] = handle;

            if (publicationFunction) {
                publicationFunction(handle);
            } else {
                Meteor.publish(col.name, function () { //TODO only subscibe current handle
                    return handle.find({});
                });
            }
        }
    };

    col.select = function (competition_name) {
        if (Meteor.isServer) {
            col.handle = col.handles[competition_name];
            console.log("connected to " + competition_name);
        }
    };

    import {Generic} from "./generic";


    if (Meteor.isClient) {
        Generic.onReady(function () {
            const genericData = Generic.handle.findOne();
            col.connect(genericData.activeContest);
        });
    } else {
        const genericData = Generic.handle.findOne();
        for (let nameID in genericData.contests) {
            col.connect(genericData.contests[nameID]);
        }
        col.select(genericData.activeContest);
    }
}