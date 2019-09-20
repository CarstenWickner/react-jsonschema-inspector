/**
 * Generic function determining whether the given value is neither undefined nor null.
 *
 * @param {*} target - value to confirm
 * @returns {boolean} whether the target is neither undefined nor null
 */
export function isDefined(target) {
    return target !== undefined && target !== null;
}

/**
 * Generic function determining whether the given value is a not-null object with at least one key.
 *
 * @param {*} target - value to confirm as non-empty object
 * @returns {boolean} whether the target is a non-empty object
 */
export function isNonEmptyObject(target) {
    return isDefined(target)
        && typeof target === "object"
        && !Array.isArray(target)
        && Object.keys(target).length > 0;
}

/**
 * Create a shallow copy of the given object and apply the given mapping function on each of its values.
 *
 * @param {Object} original - object to copy while mapping its values
 * @param {Function} mappingFunction - conversion to perform
 * @returns {Object} cloned object with same keys as the original, but with mapped values
 */
export function mapObjectValues(original, mappingFunction) {
    const mappedObject = {};
    Object.keys(original).forEach((key) => {
        mappedObject[key] = mappingFunction(original[key]);
    });
    return mappedObject;
}

/**
 * Helper function for building a function to be used in Array.reduce() – ignoring undefined/null values.
 *
 * @param {Function} mergeDefinedValues - reduce function to apply if both the given values are defined and not null
 * @param {*} mergeDefinedValues.param0 - temporary result of previous reduce steps (guaranteed to be defined and not null)
 * @param {*} mergeDefinedValues.param1 - single value to merge with first parameter (guaranteed to be defined and not null)
 * @returns {Function} also expecting two parameters: (1) the temporary result of previous reduce steps and (2) the single value to add/merge with
 */
function nullAwareReduce(mergeDefinedValues) {
    return (combined, nextValue) => {
        let mergeResult;
        if (!isDefined(combined)) {
            mergeResult = nextValue;
        } else if (!isDefined(nextValue)) {
            mergeResult = combined;
        } else {
            mergeResult = mergeDefinedValues(combined, nextValue);
        }
        return mergeResult;
    };
}

/**
 * Generic function to be used in Array.reduce() – returning the lowest encountered value.
 * Undefined/null values are being ignored.
 *
 * @param {?number} combined - temporary result of previous reduce steps
 * @param {?number} nextValue - next value to compare with
 * @returns {?number} lowest encountered value
 */
export const minimumValue = nullAwareReduce((a, b) => (a < b ? a : b));

/**
 * Generic function to be used in Array.reduce() – returning the highest encountered value.
 * Undefined/null values are being ignored.
 *
 * @param {?number} combined - temporary result of previous reduce steps
 * @param {?number} nextValue - next value to compare with
 * @returns {?number} highest encountered value
 */
export const maximumValue = nullAwareReduce((a, b) => (a > b ? a : b));

/**
 * Generic function to be used in Array.reduce() – returning all encountered values.
 * Undefined/null values are being ignored.
 *
 * @param {?*} combined - temporary result of previous reduce steps
 * @param {?*} nextValue - single value to merge with "combined"
 * @returns {?*|Array.<*>} either single (defined) value or array of multiple (defined) values
 */
export const listValues = nullAwareReduce(
    (combined, nextValue) => {
        let mergeResult;
        if (combined === nextValue) {
            mergeResult = combined;
        } else if (Array.isArray(combined)) {
            if (Array.isArray(nextValue)) {
                // both "combined" and "nextValue" are arrays already
                mergeResult = combined.concat(nextValue);
            } else {
                // "combined" is an array already but "nextValue" is a single value
                mergeResult = combined.slice();
                mergeResult.push(nextValue);
            }
        } else if (Array.isArray(nextValue)) {
            // "combined" is a single value but "nextValue" is an array already
            mergeResult = [combined].concat(nextValue);
        } else {
            // "combined" and "nextValue" are single values, to be combined into an array
            mergeResult = [combined, nextValue];
        }
        return mergeResult;
    }
);

/**
 * Generic function to be used in Array.reduce() – returning only those values that occurred in all instances with a value.
 * Undefined/null values are being ignored.
 *
 * @param {?*} combined - temporary result of previous reduce steps
 * @param {?*} nextValue - single value to merge with "combined"
 * @returns {?*|Array.<*>} either single (defined) value, array of multiple (defined) values, or empty array if encountered values do not intersect
 */
export const commonValues = nullAwareReduce(
    (combined, nextValue) => {
        let mergeResult;
        if (combined === nextValue) {
            mergeResult = combined;
        } else if (Array.isArray(combined)) {
            if (Array.isArray(nextValue)) {
                // both "combined" and "nextValue" are arrays already
                mergeResult = combined.filter(existingValue => nextValue.includes(existingValue));
                // unwrap array containing single value
                mergeResult = mergeResult.length === 1 ? mergeResult[0] : mergeResult;
            } else {
                // "combined" is an array already but "nextValue" is a single value
                mergeResult = combined.includes(nextValue) ? nextValue : [];
            }
        } else if (Array.isArray(nextValue)) {
            // "combined" is a single value but "nextValue" is an array already
            mergeResult = nextValue.includes(combined) ? combined : [];
        } else {
            // "combined" and "nextValue" are single values but are not the same
            mergeResult = [];
        }
        return mergeResult;
    }
);