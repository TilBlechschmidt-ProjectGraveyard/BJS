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
                const log = Log.getLogObject();
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
        const log = Log.getLogObject();
        const ct = COMPETITION_TYPES[0].object;
        const groupAccountA = new Account('VIa', ['VIa'], [], Crypto.generateAC('Nadel437Verräter', 'chilli'));
        const groupAccountB = new Account('VIb', ['VIb'], [], Crypto.generateAC('Termin226Frucht', 'chilli'));
        const groupAccountC = new Account('Va', ['Va'], [], Crypto.generateAC('Bahnhof495Badewanne', 'chilli'));
        const groupAccountD = new Account('Vb', ['Vb'], [], Crypto.generateAC('Rohr560Umzug', 'chilli'));
        const groupAccountE = new Account('IVa', ['IVa'], [], Crypto.generateAC('Fensterbank830Bohrmaschine', 'chilli'));
        const groupAccountF = new Account('IVb', ['IVb'], [], Crypto.generateAC('Dachboden31Windmühle', 'chilli'));
        const groupAccountG = new Account('UIIIa', ['UIIIa'], [], Crypto.generateAC('Himmel757Leichtathletik', 'chilli'));
        const groupAccountH = new Account('UIIIb', ['UIIIb'], [], Crypto.generateAC('Not879Netz', 'chilli'));
        const groupAccountI = new Account('OIIIa', ['OIIIa'], [], Crypto.generateAC('Spiegelei501Eifersucht', 'chilli'));
        const groupAccountJ = new Account('OIIIb', ['OIIIb'], [], Crypto.generateAC('Käfig452Wesen', 'chilli'));


        this.handle.insert(new Athlete(log, 'Jonas', 'Rothmann', 2006, true, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Marcus', 'Klügmann', 2006, true, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Stefan', 'Bohn', 2006, true, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Timm', 'Loos', 2006, true, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Achim', 'Beer', 2005, true, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Erwin', 'Bachmann', 2006, true, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Gert', 'Ettlinger', 2006, true, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Stefan', 'Mangels', 2005, true, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Baldur', 'Storl', 2006, true, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Achim', 'Hochmeister', 2006, true, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Cecilie', 'Denzinger', 2006, false, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Mona', 'Klemm', 2006, false, 'VIa', 'A3', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Amanda', 'Marks', 2006, false, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Nicole', 'Flesch', 2005, false, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Natascha', 'Schechter', 2006, false, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Karolin', 'Hauke', 2006, false, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Rosemarie', 'Schwertfeger', 2006, false, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Meta', 'Eicher', 2006, false, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Isabelle', 'Biel', 2006, false, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Swenja', 'Holthusen', 2005, false, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Sigrid', 'Abegg', 2006, false, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));
        this.handle.insert(new Athlete(log, 'Inge', 'Lerner', 2006, false, 'VIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountA, groupAccountA));

        this.handle.insert(new Athlete(log, 'Lars', 'Schauer', 2006, true, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Daniel', 'Specht', 2006, true, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Hubert', 'Schieffer', 2006, true, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Linus', 'Schwarzkopf', 2006, true, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Philip', 'Dalman', 2006, true, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Laurens', 'Dittrich', 2006, true, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Mario', 'Kaiser', 2005, true, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Eckhard', 'Bauernfeind', 2006, true, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Hans', 'Ehrhardt', 2006, true, 'VIb', 'A6', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Michael', 'Masur', 2005, true, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Christopher', 'Hasenclever', 2006, true, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Bernhardt', 'Goldblatt', 2006, true, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Vinzenz', 'Pauli', 2006, true, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Ekkehard', 'Arnold', 2006, true, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Lilly', 'Gustloff', 2006, false, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Lotte', 'Aigner', 2006, false, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Wilhelmine', 'Mensing', 2005, false, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Franziska', 'Schiele', 2006, false, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Amanda', 'Brandis', 2006, false, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Katharina', 'Bödeker', 2006, false, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Michelle', 'Köstler', 2006, false, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Constanze', 'Junkermann', 2006, false, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Denise', 'Fassbender', 2006, false, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Judith', 'Honig', 2006, false, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Anneliese', 'Herr', 2005, false, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Waldtraut', 'Elssler', 2006, false, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));
        this.handle.insert(new Athlete(log, 'Gertrud', 'Klugmann', 2006, false, 'VIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountB, groupAccountB));


        this.handle.insert(new Athlete(log, 'Stefan', 'Haussegger', 2005, true, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Jürgen', 'Lissauer', 2004, true, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Benno', 'Seidl', 2005, true, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Hubert', 'Schmidtke', 2005, true, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Helibert', 'Blumberg', 2005, true, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Ottilie', 'Nägelein', 2005, false, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Auguste', 'Lotz', 2005, false, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Annelie', 'Woerfel', 2004, false, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Waltraud', 'Faulhaber', 2005, false, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Leonie', 'Springborn', 2004, false, 'Va', 'A5', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Klara', 'Merz', 2005, false, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Veronika', 'Hassler', 2005, false, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Flora', 'Hamburger', 2005, false, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Angelina', 'Von Sydow', 2005, false, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Karin', 'Hecker', 2005, false, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Lena', 'Kocher', 2005, false, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Silke', 'Schulze', 2005, false, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Michelle', 'Wasser', 2005, false, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Angelika', 'Hecher', 2005, false, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Walpurgis', 'Altschul', 2005, false, 'Va', 'E', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));
        this.handle.insert(new Athlete(log, 'Sigrid', 'Froese', 2005, false, 'Va', '0', ct.maxAge, ct).encryptForDatabase(groupAccountC, groupAccountC));

        this.handle.insert(new Athlete(log, 'Antonin', 'Rödl', 2005, true, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Ernst', 'Rossel', 2005, true, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Asser', 'Glehn', 2005, true, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Manfred', 'Heller', 2005, true, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Finn', 'Stassen', 2004, true, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Albwin', 'Wöhler', 2005, true, 'Vb', 'C2', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Erik', 'Hautzig', 2004, true, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Bruno', 'Bastian', 2005, true, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'David', 'Seidenstücker', 2005, true, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Sascha', 'Lattke', 2005, true, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Karla', 'Freisler', 2005, false, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Hilda', 'Tetzlaff', 2005, false, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Bärbel', 'Kirchner', 2004, false, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Hilda', 'Apfelbaum', 2005, false, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Lena', 'Cornfeld', 2005, false, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Walburga', 'Fendler', 2005, false, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));
        this.handle.insert(new Athlete(log, 'Waltraut', 'Brenner', 2005, false, 'Vb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountD, groupAccountD));


        this.handle.insert(new Athlete(log, 'Tillmann', 'Kiesling', 2004, true, 'IVa', 'A1', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Reiner', 'Lerner', 2004, true, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Wendelin', 'Sommerfeld', 2004, true, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Marwin', 'König', 2004, true, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Steffen', 'Hönigswald', 2003, true, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Simon', 'Ehrenbaum', 2004, true, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Kuno', 'Curschmann', 2004, true, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Zacharias', 'Höfle', 2004, true, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Klemens', 'Assing', 2004, true, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Bernhardt', 'Bornemann', 2003, true, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Erhart', 'Schult', 2004, true, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Lothar', 'Seyler', 2004, true, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Lotte', 'Wiedenfeld', 2004, false, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Heidemarie', 'Riehl', 2004, false, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Noemi', 'Hirsch', 2004, false, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Rafaela', 'Wintsch', 2004, false, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));
        this.handle.insert(new Athlete(log, 'Wiebke', 'Steinmeyer', 2004, false, 'IVa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountE, groupAccountE));

        this.handle.insert(new Athlete(log, 'Marcus', 'Nessler', 2004, true, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Anatol', 'Spörl', 2004, true, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Berend', 'Schenk', 2004, true, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Helmut', 'Seck', 2004, true, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Finn', 'Schwarzenberger', 2004, true, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Jannick', 'Wackernagel', 2004, true, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Patrik', 'Böhm', 2003, true, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Frank', 'Tiedemann', 2004, true, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Elmar', 'Bode', 2004, true, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Elisabeth', 'Waldstein', 2004, false, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Jana', 'Hassler', 2004, false, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Finnja', 'Christmann', 2004, false, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Lara', 'Hasenclever', 2004, false, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Ricarda', 'Littauer', 2004, false, 'IVb', 'B1', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Sarah', 'Reitter', 2004, false, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Emily', 'Pfefferberg', 2004, false, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Katharina', 'Engelberger', 2003, false, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Gundula', 'Gessler', 2004, false, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Marion', 'Katz', 2004, false, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));
        this.handle.insert(new Athlete(log, 'Barbara', 'Eichwald', 2004, false, 'IVb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountF, groupAccountF));


        this.handle.insert(new Athlete(log, 'Thaddäus', 'Hoenigsberg', 2003, true, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Ägidius', 'Goldschmidt', 2003, true, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Alexander', 'Riedel', 2003, true, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Eckard', 'Essig', 2003, true, 'UIIIa', 'D', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Walther', 'Brack', 2002, true, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Emanuel', 'Seyler', 2003, true, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Florian', 'Schachner', 2003, true, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Maximilian', 'Henzler', 2003, true, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Helmut', 'Stosch', 2003, true, 'UIIIa', 'A4', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Jan', 'Kleinheisterkamp', 2003, true, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Dominic', 'Kehrer', 2003, true, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Elise', 'Eich', 2003, false, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Beatrix', 'Noffke', 2003, false, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Gisela', 'Brickner', 2002, false, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Isabella', 'Wassermann', 2003, false, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Annegret', 'Ungar', 2003, false, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Hanna', 'Lachs', 2003, false, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Erna', 'Danzig', 2003, false, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Josefine', 'Faulstich', 2003, false, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Petra', 'Buhler', 2003, false, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Carolin', 'Riemenschneider', 2003, false, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Cilly', 'Rosenstock', 2003, false, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Cornelia', 'Grundmann', 2002, false, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Madleen', 'Koch', 2003, false, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));
        this.handle.insert(new Athlete(log, 'Judith', 'Schönborn', 2003, false, 'UIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountG, groupAccountG));

        this.handle.insert(new Athlete(log, 'Leon', 'Schöpfer', 2003, true, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Kaleb', 'Steinhaeusser', 2003, true, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Bernhard', 'Curschmann', 2002, true, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Patrick', 'Oldenberg', 2003, true, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Joachim', 'Wach', 2003, true, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Burkhard', 'Freundlich', 2003, true, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Franz', 'Mittermeier', 2003, true, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Armin', 'Riemann', 2002, true, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Denis', 'Hillebrand', 2003, true, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Eckard', 'Sussman', 2003, true, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Henny', 'Reinhard', 2003, false, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Jasmin', 'Klügmann', 2003, false, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Grete', 'Potthast', 2003, false, 'UIIIb', 'A2', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Gretel', 'Wiesner', 2002, false, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Vanessa', 'Bähr', 2003, false, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Katharina', 'Wasser', 2003, false, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Tabea', 'Einhorn', 2003, false, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Gerda', 'Fiedler', 2003, false, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Yvonne', 'Haass', 2003, false, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Sophia', 'Wassermann', 2002, false, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Siglinde', 'Schilling', 2003, false, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));
        this.handle.insert(new Athlete(log, 'Frauke', 'Pabst', 2003, false, 'UIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountH, groupAccountH));


        this.handle.insert(new Athlete(log, 'Robin', 'Mayenburg', 2002, true, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Heiko', 'Herber', 2002, true, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Marvin', 'Blaustein', 2002, true, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Jacob', 'Marx', 2002, true, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Adelger', 'Klempner', 2001, true, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Ruprecht', 'Preisner', 2002, true, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Raimund', 'Tausche', 2002, true, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Manfred', 'Pruefer', 2002, true, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Armin', 'Reeder', 2002, true, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Robin', 'Schnitzer', 2001, true, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Hedwig', 'Ungers', 2002, false, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Luna', 'Bier', 2002, false, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Luise', 'Blum', 2001, false, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Irmelin', 'Kleinheisterkamp', 2002, false, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Olga', 'Kirchwey', 2002, false, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Alwina', 'Klee', 2002, false, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Annina', 'Blomberg', 2002, false, 'OIIIa', 'C1', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));
        this.handle.insert(new Athlete(log, 'Mirjam', 'Schürmann', 2002, false, 'OIIIa', '0', ct.maxAge, ct).encryptForDatabase(groupAccountI, groupAccountI));

        this.handle.insert(new Athlete(log, 'Roman', 'Wehinger', 2002, true, 'OIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountJ, groupAccountJ));
        this.handle.insert(new Athlete(log, 'Alois', 'Emmerich', 2002, true, 'OIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountJ, groupAccountJ));
        this.handle.insert(new Athlete(log, 'Simon', 'Dörflinger', 2001, true, 'OIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountJ, groupAccountJ));
        this.handle.insert(new Athlete(log, 'Hildebrant', 'Spitz', 2002, true, 'OIIIb', 'B2', ct.maxAge, ct).encryptForDatabase(groupAccountJ, groupAccountJ));
        this.handle.insert(new Athlete(log, 'Willi', 'Glasser', 2002, true, 'OIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountJ, groupAccountJ));
        this.handle.insert(new Athlete(log, 'Volkhardt', 'Feilhaber', 2002, true, 'OIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountJ, groupAccountJ));
        this.handle.insert(new Athlete(log, 'Eva', 'Künneth', 2001, false, 'OIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountJ, groupAccountJ));
        this.handle.insert(new Athlete(log, 'Lara', 'Kellner', 2002, false, 'OIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountJ, groupAccountJ));
        this.handle.insert(new Athlete(log, 'Fabienne', 'Schieffer', 2002, false, 'OIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountJ, groupAccountJ));
        this.handle.insert(new Athlete(log, 'Petra', 'Bachmann', 2002, false, 'OIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountJ, groupAccountJ));
        this.handle.insert(new Athlete(log, 'Beatrix', 'Friedel', 2001, false, 'OIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountJ, groupAccountJ));
        this.handle.insert(new Athlete(log, 'Ingeborg', 'Arendt', 2001, false, 'OIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountJ, groupAccountJ));
        this.handle.insert(new Athlete(log, 'Andrea', 'Blacher', 2002, false, 'OIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountJ, groupAccountJ));
        this.handle.insert(new Athlete(log, 'Walpurgis', 'Hilbert', 2002, false, 'OIIIb', '0', ct.maxAge, ct).encryptForDatabase(groupAccountJ, groupAccountJ)); 


    };
}