import { isDefined } from "./utils";

/**
 * Create a function that can be used in an `Array.map()` call on the standard `columnData` used throughout the Inspector.
 *
 * @param {Object} breadcrumbsOptions breadcrumbs options to consider
 * @param {String} breadcrumbsOptions.prefix text to prepend on the very first element
 * @param {String} breadcrumbsOptions.separator text to prepend on all but the very first element
 * @param {String} breadcrumbsOptions.arrayItemAccessor text to append if an element (which is not the trailing selection) is an array
 * @param {Function} breadcrumbsOptions.mutateName mutates name of selected item (e.g. for removing/replacing whitespaces)
 * @returns {Function} return function extracting breadcrumb text for one column
 * @returns {Object} return.column single item from the standard `columnData` array
 * @returns {Object.<String, JsonSchema>} return.column.items all displayed entries in the given column
 * @returns {String} return.column.selectedItem name of the selected entry in `items`
 * @returns {Boolean} return.column.trailingSelection flag indicating whether the column is the last (i.e. right-most) column containing a selection
 * @returns {Number} return.index index of the column in the whole `columnData`
 * @returns {String} return.return output is the breadcrumb text for the respective
 */
const createBreadcrumbBuilder = (breadcrumbsOptions) => {
    const {
        prefix = "", separator = ".", arrayItemAccessor = "[0]", mutateName
    } = breadcrumbsOptions;
    return (column, index) => {
        const { items, selectedItem, trailingSelection } = column;
        const name = mutateName ? mutateName(selectedItem, column, index) : selectedItem;
        if (!name) {
            // if mutateName() returns a falsy value (undefined|null|empty), the whole breadcrumb should be skipped
            return null;
        }
        let breadcrumb = (index === 0 ? prefix : separator) + name;
        if (!trailingSelection && arrayItemAccessor) {
            // this is not the last selection, if this entry represents an array, we should simulate an entry in the array being selected
            let itemSchema = items[selectedItem].getTypeOfArrayItems();
            while (isDefined(itemSchema)) {
                // append the given text (e.g. "[0]" or ".get(0)")
                breadcrumb += arrayItemAccessor;
                // check whether this is actually any array of arrays
                itemSchema = itemSchema.getTypeOfArrayItems();
            }
        }
        return breadcrumb;
    };
};

export default createBreadcrumbBuilder;
