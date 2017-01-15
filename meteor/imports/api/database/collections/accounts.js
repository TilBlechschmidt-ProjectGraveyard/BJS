import {Account} from "../../logic/account";
import {Crypto} from "../../crypto/crypto";
import {ContestCollection} from "./collection";


export function initAccounts() {
    Meteor.COLLECTIONS.Accounts = new ContestCollection('Accounts', function (name, handle) {
        handle.deny({
            insert() {
                return true;
            },
            update() {
                return true;
            },
            remove() {
                return true;
            },
        });

        Meteor.publish(name, function () {
            return handle.find({}, {
                fields: {
                    'ac.privHash': false
                }
            });
        });
    });

    Meteor.COLLECTIONS.Accounts.createMockData = function () {
        for (let i = 0; i < 10; i++) {
            this.handle.insert(new Account('Q#z' + i, ['Q#z' + i], [], Crypto.generateAC('1234_' + i, 'pepper')));
        }
        this.handle.insert(new Account('VIa', ['VIa'], [], Crypto.generateAC('Nadel437Verräter', 'chilli')));
        this.handle.insert(new Account('VIb', ['VIb'], [], Crypto.generateAC('Termin226Frucht', 'chilli')));
        this.handle.insert(new Account('Va', ['Va'], [], Crypto.generateAC('Bahnhof495Badewanne', 'chilli')));
        this.handle.insert(new Account('Vb', ['Vb'], [], Crypto.generateAC('Rohr560Umzug', 'chilli')));
        this.handle.insert(new Account('IVa', ['IVa'], [], Crypto.generateAC('Fensterbank830Bohrmaschine', 'chilli')));
        this.handle.insert(new Account('IVb', ['IVb'], [], Crypto.generateAC('Dachboden31Windmühle', 'chilli')));
        this.handle.insert(new Account('UIIIa', ['UIIIa'], [], Crypto.generateAC('Himmel757Leichtathletik', 'chilli')));
        this.handle.insert(new Account('UIIIb', ['UIIIb'], [], Crypto.generateAC('Not879Netz', 'chilli')));
        this.handle.insert(new Account('OIIIa', ['OIIIa'], [], Crypto.generateAC('Spiegelei501Eifersucht', 'chilli')));
        this.handle.insert(new Account('OIIIb', ['OIIIb'], [], Crypto.generateAC('Käfig452Wesen', 'chilli')));
        this.handle.insert(new Account('Sprint 50m \(Handzeitmessung\)', [], ['st_sprint_50'], Crypto.generateAC('Ständchen859Nacht', 'pepper')));
        this.handle.insert(new Account('Sprint 75m \(Handzeitmessung\)', [], ['st_sprint_75'], Crypto.generateAC('Wiede291Konzert', 'pepper')));
        this.handle.insert(new Account('Sprint 100m \(Elektronische Messung\)', [], ['st_sprint_100_el'], Crypto.generateAC('Saft72Meile', 'pepper')));
        this.handle.insert(new Account('Ausdauerlauf 800m', [], ['st_endurance_800'], Crypto.generateAC('Geige499Gewicht', 'pepper')));
        this.handle.insert(new Account('Ausdauerlauf 1000m', [], ['st_endurance_1000'], Crypto.generateAC('Zauberei448Abwicklung', 'pepper')));
        this.handle.insert(new Account('Ausdauerlauf 2000m', [], ['st_endurance_2000'], Crypto.generateAC(' Pflaster236Glühlampe', 'pepper')));
        this.handle.insert(new Account('Ausdauerlauf 3000m', [], ['st_endurance_3000'], Crypto.generateAC('Erhebung98Asylant', 'pepper')));
        this.handle.insert(new Account('Weitsprung', [], ['st_long_jump'], Crypto.generateAC('Joch338Bohne', 'pepper')));
        this.handle.insert(new Account('Hochsprung', [], ['st_high_jump'], Crypto.generateAC('Fuß622Einkünft', 'pepper')));
        this.handle.insert(new Account('Schlagball 80g', [], ['st_rounders'], Crypto.generateAC('Anwohner860Hass', 'pepper')));
        this.handle.insert(new Account('Kugelstoßen 3kg', [], ['st_shot_put_3'], Crypto.generateAC('Quark360Leerlauf', 'pepper')));
        this.handle.insert(new Account('Kugelstoßen 4kg', [], ['st_shot_put_4'], Crypto.generateAC('Knöchel357Datum', 'pepper')));
        this.handle.insert(new Account('Kugelstoßen 5kg', [], ['st_shot_put_5'], Crypto.generateAC('Tiefkühltruhe144Kunde', 'pepper')));
        this.handle.insert(new Account('Kugelstoßen 6kg', [], ['st_shot_put_6'], Crypto.generateAC('Hafen375Führerschein', 'pepper')));
        this.handle.insert(new Account('Kugelstoßen 7,26kg', [], ['st_shot_put_7.26'], Crypto.generateAC('Bügeleisen4Sprechstundenhilfe', 'pepper')));
        this.handle.insert(new Account('Ball 200g', [], ['st_ball_200'], Crypto.generateAC('Dreiheit97Anspruch', 'pepper')));
        this.handle.insert(new Account('Schleuderball 1kg', [], ['st_ball_with_throwing_strap_1'], Crypto.generateAC('Pfanne927Chirurg', 'pepper')));
        this.handle.insert(new Account('Urkunden', [], [''], Crypto.generateAC('Ermutigung328Wäschestände', 'pepper'), true));
    };
}