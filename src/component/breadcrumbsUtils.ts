import { InspectorProps, RenderColumn, RenderOptionsColumn } from "./InspectorTypes";

/**
 * @name BreadcrumbBuilder
 * @function
 * @param {object} column - single item from the standard `columnData` array
 * @param {?object} column.options - object representing the hierarchy of options listed in the column
 * @param {string|Array.<number>} column.selectedItem - name of the selected entry in `items` or `optionIndexes` indicating selected option
 * @param {number} index - index of the column in the whole `columnData`
 * @returns {?string} output is the breadcrumb text for the respective item/column
 */
/**
 * Create a function that can be used in an `Array.map()` call on the standard `columnData` used throughout the Inspector.
 *
 * @param {object} breadcrumbsOptions - breadcrumbs options to consider
 * @param {?string} breadcrumbsOptions.prefix - text to prepend on the very first element
 * @param {?string} breadcrumbsOptions.separator - text to prepend on all but the very first element
 * @param {?Function} breadcrumbsOptions.skipSeparator - determines whether the separator should be omitted for a non-root item
 * @param {?Function} breadcrumbsOptions.mutateName - mutates name of selected item (e.g. for removing/replacing white-spaces)
 * @returns {BreadcrumbBuilder} function extracting breadcrumb text for one column
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createBreadcrumbBuilder = (breadcrumbsOptions: InspectorProps["breadcrumbs"] & {}) => {
    const { prefix = "", separator = ".", skipSeparator, mutateName } = breadcrumbsOptions;
    return (column: RenderColumn, index: number): string | null => {
        if ((column as RenderOptionsColumn).options) {
            // no breadcrumb for option selection
            return null;
        }
        const { selectedItem } = column;
        const name = mutateName ? mutateName(selectedItem as string, column, index) : (selectedItem as string);
        if (!name) {
            // if mutateName() returns a falsy value (undefined|null|empty), the whole breadcrumb should be skipped
            return null;
        }
        if (index === 0) {
            return prefix + name;
        }
        if (skipSeparator && skipSeparator(name, column, index)) {
            return name;
        }
        return separator + name;
    };
};
