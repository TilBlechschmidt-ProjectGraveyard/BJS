import {Athletics} from "./competition_types/athletics.js";
import {Swimming} from "./competition_types/swimming.js";


/**
 * @typedef {Object} ConversionFactors
 * @property {number} A1 Conversion Factor for start class 'A1'
 * @property {number} A2 Conversion Factor for start class 'A2'
 * @property {number} A3 Conversion Factor for start class 'A3'
 * @property {number} A4 Conversion Factor for start class 'A4'
 * @property {number} A5 Conversion Factor for start class 'A5'
 * @property {number} A6 Conversion Factor for start class 'A6'
 * @property {number} B1 Conversion Factor for start class 'B1'
 * @property {number} B2 Conversion Factor for start class 'B2'
 * @property {number} C1 Conversion Factor for start class 'C1'
 * @property {number} C2 Conversion Factor for start class 'C2'
 * @property {number} D Conversion Factor for start class 'D'
 * @property {number} E Conversion Factor for start class 'E'
 */

export const COMPETITION_TYPES = [
    {
        id: 'ct_athletics',
        object: Athletics
    },
    {
        id: 'ct_swimming',
        object: Swimming
    }
];

/**
 * Returns the competition type by a given id.
 * @param {number} id - The id of the competition type. It matches the position in the Array COMPETITION_TYPES;
 * @returns {object} The competition type (Athletics or Swimming)
 */
export function getCompetitionTypeByID(id) {
    if (id === 0) {
        return Athletics;
    } else {
        return Swimming;
    }
}