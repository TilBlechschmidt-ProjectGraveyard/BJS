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
        this.handle.insert(new Account('Urkunden', [], [''], Crypto.generateAC('Nach406Freien', 'pepper'), true));


        this.handle.insert(new Account('Sprint', [], ['st_sprint_50', 'st_sprint_75', 'st_sprint_100_el'], Crypto.generateAC('Airbus637Horn', 'pepper')));
        this.handle.insert(new Account('Ausdauerlauf', [], ['st_endurance_800', 'st_endurance_1000', 'st_endurance_2000', 'st_endurance_3000'], Crypto.generateAC('Songs836Nabel', 'pepper')));
        this.handle.insert(new Account('Weitsprung', [], ['st_long_jump'], Crypto.generateAC('Proben912Signal', 'pepper')));
        this.handle.insert(new Account('Hochsprung', [], ['st_high_jump'], Crypto.generateAC('Datei155Sogar', 'pepper')));
        this.handle.insert(new Account('Wurf', [], ['st_rounders', 'st_ball_200', 'st_ball_with_throwing_strap_1'], Crypto.generateAC('Lyrik205BDI', 'pepper')));
        this.handle.insert(new Account('Kugelstoßen', [], ['st_shot_put_3', 'st_shot_put_4', 'st_shot_put_5', 'st_shot_put_6', 'st_shot_put_7.26'], Crypto.generateAC('EG367Wasser', 'pepper')));


        this.handle.insert(new Account('VIa', ['VIa'], [], Crypto.generateAC('Mars456Kohl', 'chilli')));
        this.handle.insert(new Account('VIb', ['VIb'], [], Crypto.generateAC('Doktor375Dialog', 'chilli')));
        this.handle.insert(new Account('Va', ['Va'], [], Crypto.generateAC('ARD865Paare', 'chilli')));
        this.handle.insert(new Account('Vb', ['Vb'], [], Crypto.generateAC('Grosny21Jutta', 'chilli')));
        this.handle.insert(new Account('IVa', ['IVa'], [], Crypto.generateAC('Fisch799V', 'chilli')));
        this.handle.insert(new Account('IVb', ['IVb'], [], Crypto.generateAC('Stolpe278Idee', 'chilli')));
        this.handle.insert(new Account('UIIIa', ['UIIIa'], [], Crypto.generateAC('Hier968Kalb', 'chilli')));
        this.handle.insert(new Account('UIIIb', ['UIIIb'], [], Crypto.generateAC('Kinn13Horn', 'chilli')));
        this.handle.insert(new Account('OIIIa', ['OIIIa'], [], Crypto.generateAC('Ton897Vieh', 'chilli')));
        this.handle.insert(new Account('OIIIb', ['OIIIb'], [], Crypto.generateAC('Schal794Menge', 'chilli')));
    };
}