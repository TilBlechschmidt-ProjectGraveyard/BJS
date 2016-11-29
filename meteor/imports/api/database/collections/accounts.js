import {Account} from "../../logic/account";
import {generateAC} from "../../crypto/crypto";
import {Collection} from "./collection";

export let Accounts = new Collection('Accounts', true);

Accounts.createMockData = function () {
    this.handle.insert(new Account(['Q#z'], [], generateAC('1234567ljhfaljawf8', 'pepper')));
    this.handle.insert(new Account([], ['st_long_jump'], generateAC('jsdhfiudhfiuahfd', 'pepper')));
    this.handle.insert(new Account(['Q#z'], ['st_long_jump', 'st_ball_200', 'st_ball_200', 'st_endurance_1000', 'st_endurance_3000', 'st_sprint_100'], generateAC('hflhkfks;kjfjankfa', 'pepper')));
};