/**
 * Generic function determining whether the given value is neither undefined nor null.
 *
 * @param {*} target - value to confirm
 * @returns {boolean} whether the target is neither undefined nor null
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function isDefined<T>(target: T): target is T & {} {
    return target !== undefined && target !== null;
}

/**
 * Generic function determining whether the given value is a not-null object with at least one key.
 *
 * @param {*} target - value to confirm as non-empty object
 * @returns {boolean} whether the target is a non-empty object
 */
export function isNonEmptyObject<T>(target: T): target is T & Record<string, any> {
    return isDefined(target) && typeof target === "object" && !Array.isArray(target) && Object.keys(target).length > 0;
}

/**
 * Create a shallow copy of the given object and apply the given mapping function on each of its values.
 *
 * @param {object} original - object to copy while mapping its values
 * @param {Function} mappingFunction - conversion to perform
 * @returns {object} cloned object with same keys as the original, but with mapped values
 */
export function mapObjectValues<O extends Record<string, S>, S, T>(original: O, mappingFunction: (value: S) => T): { [key in keyof O]: T } {
    const mappedObject: { [key in keyof O]?: T } = {};
    Object.keys(original).forEach((key: keyof O) => {
        const mappedValue = mappingFunction(original[key]);
        if (isDefined(mappedValue)) {
            mappedObject[key] = mappedValue;
        }
    });
    return mappedObject as { [key in keyof O]: T };
}

/**
 * Helper function for building a function to be used in Array.reduce() – ignoring undefined/null values.
 *
 * @param {Function} mergeDefinedValues - reduce function to apply if both the given values are defined and not null
 * @param {*} mergeDefinedValues.param0 - temporary result of previous reduce steps (guaranteed to be defined and not null)
 * @param {*} mergeDefinedValues.param1 - single value to merge with first parameter (guaranteed to be defined and not null)
 * @returns {Function} also expecting two parameters: (1) the temporary result of previous reduce steps and (2) the single value to add/merge with
 */
function nullAwareReduce<T>(mergeDefinedValues: (combined: T, nextValue: T) => T) {
    return (combined: T | undefined, nextValue?: T | undefined): T | undefined => {
        let mergeResult: T | undefined;
        if (!isDefined(nextValue)) {
            mergeResult = combined;
        } else if (!isDefined(combined)) {
            mergeResult = nextValue;
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
export const minimumValue: (combined: number | undefined, nextValue?: number | undefined) => number | undefined = nullAwareReduce((a, b) =>
    a < b ? a : b
);

/**
 * Generic function to be used in Array.reduce() – returning the highest encountered value.
 * Undefined/null values are being ignored.
 *
 * @param {?number} combined - temporary result of previous reduce steps
 * @param {?number} nextValue - next value to compare with
 * @returns {?number} highest encountered value
 */
export const maximumValue: (combined: number | undefined, nextValue?: number | undefined) => number | undefined = nullAwareReduce((a, b) =>
    a > b ? a : b
);

/**
 * Generic function to be used in Array.reduce() – returning all encountered values.
 * Undefined/null values are being ignored.
 *
 * @param {?*} combined - temporary result of previous reduce steps
 * @param {?*} nextValue - single value to merge with "combined"
 * @returns {?*|Array.<*>} either single (defined) value or array of multiple (defined) values
 */
export const listValues = nullAwareReduce(<S, T extends S | Array<S>>(combined: T | undefined, nextValue: S) => {
    let mergeResult: T;
    if (combined === nextValue) {
        mergeResult = combined;
    } else if (Array.isArray(combined)) {
        if (Array.isArray(nextValue)) {
            // both "combined" and "nextValue" are arrays already
            mergeResult = combined.concat(nextValue) as T;
        } else {
            // "combined" is an array already but "nextValue" is a single value
            mergeResult = combined.slice() as T;
            (mergeResult as Array<S>).push(nextValue);
        }
    } else if (Array.isArray(nextValue)) {
        // "combined" is a single value but "nextValue" is an array already
        mergeResult = [combined as S].concat(nextValue) as T;
    } else {
        // "combined" and "nextValue" are single values, to be combined into an array
        mergeResult = [combined as S, nextValue] as T;
    }
    return mergeResult;
});

/**
 * Generic function to be used in Array.reduce() – returning only those values that occurred in all instances with a value.
 * Undefined/null values are being ignored.
 *
 * @param {?*} combined - temporary result of previous reduce steps
 * @param {?*} nextValue - single value to merge with "combined"
 * @returns {?*|Array.<*>} either single (defined) value, array of multiple (defined) values, or empty array if encountered values do not intersect
 */
export const commonValues = nullAwareReduce(<S, T extends S | Array<S>>(combined: T, nextValue: T) => {
    let mergeResult: T | undefined;
    if (combined === nextValue) {
        mergeResult = combined;
    } else if (Array.isArray(combined)) {
        if (Array.isArray(nextValue)) {
            // both "combined" and "nextValue" are arrays already
            const filteredCombined = (combined as Array<S>).filter((existingValue) => nextValue.includes(existingValue));
            // unwrap array containing single value
            mergeResult = (filteredCombined.length === 1 ? filteredCombined[0] : filteredCombined) as T;
        } else {
            // "combined" is an array already but "nextValue" is a single value
            mergeResult = combined.includes(nextValue) ? nextValue : ([] as unknown as T);
        }
    } else if (Array.isArray(nextValue)) {
        // "combined" is a single value but "nextValue" is an array already
        mergeResult = nextValue.includes(combined) ? combined : ([] as unknown as T);
    } else {
        // "combined" and "nextValue" are single values but are not the same
        mergeResult = [] as unknown as T;
    }
    return mergeResult;
});

/**
 * Helper function for extracting a given URI's base URI.
 *
 * @param {string} uri - URI for which to determine the base URI
 * @returns {string} base URI
 */
export const deriveBaseUri = (uri: string): string => {
    // discard trailing fragment and/or query segments
    const cleanUri = uri.split("?")[0].split("#")[0];
    // determine whether there is any path segment
    const lastSlashIndex = cleanUri.lastIndexOf("/");
    if (lastSlashIndex > cleanUri.indexOf("://") + 2) {
        // cut-off trailing path segment
        return cleanUri.substring(0, lastSlashIndex + 1);
    }
    // append slash to ensure uniform base URI
    return `${cleanUri}/`;
};
