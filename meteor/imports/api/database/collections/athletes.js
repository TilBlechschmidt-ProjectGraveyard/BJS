import {COMPETITION_TYPES} from "../../logic/competition_type";
import {Athlete} from "../../logic/athlete";
import {Log} from "../../log";
import {Crypto} from "../../crypto/crypto";
import {ContestCollection} from "./collection";
import {Account} from "../../logic/account";
import {DBInterface} from "../DBInterface";

let encryptAsAdmin;

if (Meteor.isServer) {
    encryptAsAdmin = require("../../../startup/server/helpers").encryptAsAdmin;
}

export function initAthletes() {
    Meteor.COLLECTIONS.Athletes = new ContestCollection('Athletes', function (name, handle) {
        handle.before.update(function (userId, doc, fieldNames, modifier) {
            if (modifier.hasOwnProperty('$set')) {
                for (let name in modifier.$set) {
                    if (!modifier.$set.hasOwnProperty(name)) continue;

                    if (name.substr(0, 2) === "m_") {
                        if (!doc.hasOwnProperty(name)) {
                            modifier.$set[name].synced = true;
                        }
                    }
                }
            }
        });

        handle.after.update(function (userId, doc, fieldNames, modifier) {
            let updateRequired = false;
            if (modifier.hasOwnProperty('$set')) {
                for (let name in modifier.$set) {
                    if (!modifier.$set.hasOwnProperty(name)) continue;

                    if (name.substr(0, 2) === "m_") {
                        updateRequired = true;
                    }
                }
            }

            if (updateRequired) {
                const ct = DBInterface.getCompetitionType();
                const log = new Log();
                const accounts = Meteor.COLLECTIONS.Accounts.handle.find().fetch();
                const athlete = Athlete.decryptFromDatabase(log, doc, accounts, true, true);
                const valid = ct.validate(log, athlete, accounts, true);
                const certificate = ct.generateCertificate(log, athlete, accounts, true);

                handle.update({_id: doc._id}, {
                    $set: {
                        currentScore: encryptAsAdmin(certificate.score),
                        stScores: encryptAsAdmin(certificate.stScores),
                        certificate: encryptAsAdmin(certificate.certificate),
                        certificateValid: encryptAsAdmin(valid)
                    }
                });
            }
        });

        handle.after.insert(function (userId, doc, fieldNames, modifier) {
            console.log("setting fields");
            console.log(doc);
            handle.update({_id: doc._id}, {
                $set: {
                    currentScore: encryptAsAdmin(0),
                    stScores: encryptAsAdmin({}),
                    certificate: encryptAsAdmin(0),
                    certificateScore: encryptAsAdmin(0),
                    certificateTime: encryptAsAdmin(0),
                    certificatedBy: encryptAsAdmin(""),
                    certificateValid: encryptAsAdmin(false)
                }
            });
        });

        Meteor.publish(name, function () {
            return handle.find({});
        });
    });

    Meteor.COLLECTIONS.Athletes.createMockData = function () {
        const log = new Log();
        const ct = COMPETITION_TYPES[0].object;
        const groupAccountA = new Account('Q#a', ['Q#a'], [], Crypto.generateAC('1234', 'chilli'));
        const groupAccountB = new Account('Q#b', ['Q#b'], [], Crypto.generateAC('12345', 'chilli'));
        const serverAccount = new Account('Admin', ['Q#z'], ['st_long_jump', 'st_ball_200', 'st_endurance_1000', 'st_endurance_3000', 'st_sprint_100'], Crypto.generateAC('passwort', 'pepper'));

        const pTest = new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#a', '0', ct.maxAge, ct);
        pTest.certificateScore = 15;
        pTest.certificateTime = 12423234234253;
        pTest.certificatedBy = "TheAlien";
        this.handle.insert(pTest.encryptForDatabase(groupAccountA, serverAccount));
        this.handle.insert(new Athlete(log, 'Klaus', 'Schmidt', 1999, true, 'Q#a', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, serverAccount));
        this.handle.insert(new Athlete(log, 'Herbert', 'Gronewoldt', 1989, true, 'Q#a', 'A3', ct.maxAge, ct).encryptForDatabase(groupAccountA, serverAccount));
        this.handle.insert(new Athlete(log, 'Morten', 'Meier', 1998, true, 'Q#a', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, serverAccount));
        this.handle.insert(new Athlete(log, 'Mark', 'Forster', 1988, true, 'Q#a', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, serverAccount));
        this.handle.insert(new Athlete(log, 'Hans', 'Stüber', 1992, true, 'Q#a', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, serverAccount));
        this.handle.insert(new Athlete(log, 'Maximilian', 'Humboldt', 1996, true, 'Q#b', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, serverAccount));
        this.handle.insert(new Athlete(log, 'Hartwig', 'Grumboldt', 1994, true, 'Q#b', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, serverAccount));
        this.handle.insert(new Athlete(log, 'Hedwig', 'Potter', 1962, false, 'Q#b', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, serverAccount));
        this.handle.insert(new Athlete(log, 'Harry', 'Potter', 1960, true, 'Q#b', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, serverAccount));
        this.handle.insert(new Athlete(log, 'Dr.', 'Who', 1, true, 'Q#b', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, serverAccount));
        this.handle.insert(new Athlete(log, 'Amy', 'Pond', 1990, false, 'Q#b', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, serverAccount));

        // add example measurement
        const ps = DBInterface.getAthletesOfAccounts(log, [groupAccountA], false);
        const p = ps[0];
        p.addMeasurement(log, 'st_long_jump', [7.33], groupAccountA, serverAccount);
        p.addMeasurement(log, 'st_ball_200', [70], groupAccountA, serverAccount);
        p.addMeasurement(log, 'st_endurance_1000', [160], groupAccountA, serverAccount);
        p.addMeasurement(log, 'st_endurance_3000', [640], groupAccountA, serverAccount);
        p.addMeasurement(log, 'st_sprint_100', [10], groupAccountA, serverAccount);

        const p2 = ps[1];
        p2.addMeasurement(log, 'st_long_jump', [7.33], groupAccountA, serverAccount);
        p2.addMeasurement(log, 'st_ball_200', [5.55], groupAccountA, serverAccount);
        p2.addMeasurement(log, 'st_sprint_100', [9.32], groupAccountA, serverAccount);

        const p3s = DBInterface.getAthletesOfAccounts(log, [groupAccountA], false);
        for (let i = 0; i < 6; i++) {
            const p3 = p3s[i];
            p3.addMeasurement(log, 'st_long_jump', [7.33], groupAccountA, serverAccount);
            p3.addMeasurement(log, 'st_ball_200', [5.55], groupAccountA, serverAccount);
            p3.addMeasurement(log, 'st_sprint_100', [9.32], groupAccountA, serverAccount);
            p3.addMeasurement(log, 'st_endurance_1000', [200], groupAccountA, serverAccount);
            p3.addMeasurement(log, 'st_endurance_3000', [540], groupAccountA, serverAccount);
        }
    };
}