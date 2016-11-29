import {COMPETITION_TYPES} from "../../logic/competition_type";
import {Athlete} from '../../logic/athlete';
import {Log} from "../../log";
import {generateAC} from "../../crypto/crypto";
import {Collection} from './collection';

export let Athletes = new Collection('Athletes', true);

Athletes.createMockData = function () {
    const log = new Log();
    const ct = COMPETITION_TYPES[0].object;
    const ac = generateAC("potato", "pepper");
    this.handle.insert(new Athlete(log, 'Hans', 'Müller', 2000, true, 'Q#z', '0', ct.maxAge, ct).encryptForDatabase(ac));
};