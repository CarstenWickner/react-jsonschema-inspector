/**
 * Generic function determining whether the given value is neither undefined nor null.
 *
 * @param {*} target value to confirm
 * @returns {boolean} whether the target is neither undefined nor null
 */
export function isDefined(target) {
    return target !== undefined && target !== null;
}

/**
 * Generic function determining whether the given value is a not-null object with at least one key.
 *
 * @param {*} target value to confirm as non-empty object
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
 * @param {Object} original object to copy while mapping its values
 * @param {Function} mappingFunction conversion to perform
 * @return {Object} cloned object with same keys as the original, but with mapped values
 */
export function mapObjectValues(original, mappingFunction) {
    const mappedObject = {};
    Object.keys(original).forEach((key) => {
        mappedObject[key] = mappingFunction(original[key]);
    });
    return mappedObject;
}

/**
 * Generic function to be used in Array.reduce() - assuming objects are being merged.
 *
 * @param {?Object} combined temporary result of previous reduce steps
 * @param {?Object} nextValue single value to merge with "combined"
 * @returns {?Object} merged values
 */
export function mergeObjects(combined, nextValue) {
    let mergeResult;
    if (!isNonEmptyObject(combined)) {
        mergeResult = nextValue;
    } else if (!isNonEmptyObject(nextValue)) {
        mergeResult = combined;
    } else if (combined === nextValue) {
        mergeResult = combined;
    } else {
        mergeResult = Object.assign({}, combined, nextValue);
    }
    return mergeResult;
}

/**
 * Generic function to be used in Array.reduce().
 *
 * @param {*} combined temporary result of previous reduce steps
 * @param {*} nextValue single value to merge with "combined"
 * @returns {*|Array.<*>} either single (defined) value or array of multiple (defined) values
 */
export function listValues(combined, nextValue) {
    let mergeResult;
    if (!isDefined(combined)) {
        mergeResult = nextValue;
    } else if (!isDefined(nextValue)) {
        mergeResult = combined;
    } else if (combined === nextValue) {
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
