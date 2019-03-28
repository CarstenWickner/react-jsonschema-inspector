/**
 * Create a function that can be used in an `Array.map()` call on the standard `columnData` used throughout the Inspector.
 *
 * @param {Object} breadcrumbsOptions breadcrumbs options to consider
 * @param {String} breadcrumbsOptions.prefix text to prepend on the very first element
 * @param {String} breadcrumbsOptions.separator text to prepend on all but the very first element
 * @param {Function} breadcrumbsOptions.mutateName mutates name of selected item (e.g. for removing/replacing white-spaces)
 * @returns {Function} return function extracting breadcrumb text for one column
 * @returns {Object} return.column single item from the standard `columnData` array
 * @returns {?Array.<Number>} return.column.options array of optionIndexes
 * @returns {String} return.column.selectedItem name of the selected entry in `items`
 * @returns {Number} return.index index of the column in the whole `columnData`
 * @returns {String} return.return output is the breadcrumb text for the respective
 */
const createBreadcrumbBuilder = (breadcrumbsOptions) => {
    const { prefix = "", separator = ".", mutateName } = breadcrumbsOptions;
    return (column, index) => {
        const { options, selectedItem } = column;
        if (options) {
            // no breadcrumb for option selection
            return null;
        }
        const name = mutateName ? mutateName(selectedItem, column, index) : selectedItem;
        if (!name) {
            // if mutateName() returns a falsy value (undefined|null|empty), the whole breadcrumb should be skipped
            return null;
        }
        return (index === 0 ? prefix : separator) + name;
    };
};

export default createBreadcrumbBuilder;
