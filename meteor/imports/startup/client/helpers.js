export let arrayify = function (obj) {
    let result = [];
    for (let key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        const new_obj = obj[key];
        new_obj.name = key;
        result.push(new_obj);
    }
    return result;
};