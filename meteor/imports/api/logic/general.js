/**
 * filters all undefined from an array.
 * @param data: {Array}
 * @returns {Array}
 */
export function filterUndefined(data) {
    return _.filter(data, function (data_object) {
        return data_object !== undefined;
    });
}