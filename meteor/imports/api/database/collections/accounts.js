import {Account} from '../../logic/account';
import {generateAC} from "../../crypto/crypto";
import {Collection} from './collection';

export let Accounts = new Collection('Accounts', true);

Accounts.createMockData = function () {
    const ac = generateAC("potato", "pepper");
    this.handle.insert(new Account(["st_sprint_50_el"], [], ac));
    this.handle.insert(new Account([], ["Q#a"], ac));
    this.handle.insert(new Account(["st_sprint_50_el", "st_sprint_50"], ["Q#z"], ac));
};