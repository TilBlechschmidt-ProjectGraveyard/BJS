export function findIndexOfAthlete(athletes, id) {
    for (let i in athletes) {
        if (!athletes.hasOwnProperty(i)) continue;
        if (athletes[i].id == id) {
            return i;
        }
    }
}

export function countTrue(list) {
    let counter = 0;

    for (let a in list) {
        if (!list.hasOwnProperty(a)) continue;
        if (list[a] == true) { //== true required because list[a] might be an object
            counter += 1;
        }
    }
    return counter;
}


export function statusToNumber(athlete) {
    if (isReady(athlete)) return 0;
    if (isUpdate(athlete)) return 1;
    if (isNotReady(athlete)) return 2;
    if (isFinish(athlete)) return 3;
}

export function isReady(athlete) {
    return athlete.valid && !athlete.certificateWritten && !athlete.certificateUpdate;
}

export function isNotReady(athlete) {
    return !athlete.valid;
}

export function isUpdate(athlete) {
    return athlete.valid && athlete.certificateUpdate;
}

export function isFinish(athlete) {
    return athlete.valid && athlete.certificateWritten && !athlete.certificateUpdate;
}