/**
 * @summary filters all undefined from an array.
 * @param data: {Array}
 * @returns {Array}
 */
export function filterUndefined(data) {
    return _.filter(data, function (dataObject) {
        return dataObject !== undefined;
    });
}