import PropTypes from "prop-types";

import JsonSchema from "../model/JsonSchema";
import JsonSchemaGroup from "../model/JsonSchemaGroup";
import {
    createGroupFromSchema, getPropertiesFromSchemaGroup, getTypeOfArrayItemsFromSchemaGroup,
    createOptionTargetArrayFromIndexes, getOptionsInSchemaGroup, getIndexPermutationsForOptions
} from "../model/schemaUtils";
import { isDefined, isNonEmptyObject, mapObjectValues } from "../model/utils";
import { createFilterFunctionForSchema } from "../model/searchUtils";

function isOptionIndexValidForOptions(optionIndexes, options) {
    let optionsPart = options;
    optionIndexes.forEach((index) => {
        if (optionsPart && optionsPart.options && optionsPart.options.length > index) {
            optionsPart = optionsPart.options[index];
        } else {
            optionsPart = null;
        }
    });
    return optionsPart && !optionsPart.options;
}

function createRootColumnData(schemas, referenceSchemas, parserConfig) {
    // first prepare those schemas that may be referenced by the displayed ones or each other
    const referenceScopes = [];
    referenceSchemas.forEach((rawRefSchema) => {
        const newReferenceScope = new JsonSchema(rawRefSchema, parserConfig).scope;
        referenceScopes.forEach((otherReferenceScope) => {
            newReferenceScope.addOtherScope(otherReferenceScope);
            otherReferenceScope.addOtherScope(newReferenceScope);
        });
        referenceScopes.push(newReferenceScope);
    });
    // the first column always lists all top-level schemas
    const rootColumnItems = mapObjectValues(schemas, (rawSchema) => {
        const schema = new JsonSchema(rawSchema, parserConfig);
        referenceScopes.forEach(referenceScope => schema.scope.addOtherScope(referenceScope));
        return createGroupFromSchema(schema);
    });
    return { items: rootColumnItems };
}

function buildDefaultArrayProperties(arrayItemSchema) {
    return { "[0]": arrayItemSchema };
}

function buildNextColumn(schemaGroup, optionIndexes, buildArrayProperties = buildDefaultArrayProperties) {
    if (!optionIndexes) {
        const options = getOptionsInSchemaGroup(schemaGroup);
        if (options.options) {
            // next column should offer the selection of options within the schema group
            return {
                contextGroup: schemaGroup,
                options
            };
        }
    }
    // next column should list all available properties
    const propertySchemas = getPropertiesFromSchemaGroup(schemaGroup, optionIndexes);
    if (isNonEmptyObject(propertySchemas)) {
        // convert the individual JsonSchema values into JsonSchemaGroups
        return {
            items: mapObjectValues(propertySchemas, createGroupFromSchema)
        };
    }
    // there are no properties, so this might be an array
    const nestedArrayItemSchema = getTypeOfArrayItemsFromSchemaGroup(schemaGroup, optionIndexes);
    if (nestedArrayItemSchema) {
        // next column should allow accessing the schema of the array's items
        const arrayProperties = mapObjectValues(
            buildArrayProperties(nestedArrayItemSchema),
            propertyValue => (
                propertyValue instanceof JsonSchema ? propertyValue : new JsonSchema(propertyValue, nestedArrayItemSchema.parserConfig)
            )
        );

        return {
            items: mapObjectValues(arrayProperties, createGroupFromSchema)
        };
    }
    return {};
}

export function createRenderDataBuilder(onSelectInColumn) {
    return (schemas, referenceSchemas, selectedItems, parserConfig, buildArrayProperties) => {
        // the first column always lists all top-level schemas
        let nextColumn = createRootColumnData(schemas, referenceSchemas, parserConfig);
        let selectedSchemaGroup;
        const columnData = selectedItems.map((selection, index) => {
            const currentColumn = nextColumn;
            const isOptionSelection = typeof selection !== "string";
            let isValidSelection;
            if (isOptionSelection && selectedSchemaGroup && currentColumn.options) {
                isValidSelection = isOptionIndexValidForOptions(selection, currentColumn.options);
            } else if (!isOptionSelection && currentColumn.items) {
                selectedSchemaGroup = currentColumn.items[selection];
                isValidSelection = isDefined(selectedSchemaGroup);
            }
            if (isValidSelection) {
                nextColumn = buildNextColumn(selectedSchemaGroup, isOptionSelection ? selection : undefined, buildArrayProperties);
                if (isOptionSelection) {
                    selectedSchemaGroup = null;
                }
            } else {
                nextColumn = {};
            }
            // name of the selected item (i.e. key in 'items') or int array of option indexes
            currentColumn.selectedItem = isValidSelection ? selection : null;
            currentColumn.onSelect = onSelectInColumn(index);
            return currentColumn;
        }).filter(({ items, options }) => items || options);
        // set the flag for the last column containing a valid selection
        const columnCount = columnData.length;
        if (columnCount) {
            // there is at least one column, check whether the last column has a valid selection
            const selectedItemInLastColumn = columnData[columnCount - 1].selectedItem;
            // if the last column has no valid selection, the second to last column must have one
            if (selectedItemInLastColumn || columnCount > 1) {
                // there is at least one column with a valid selection, mark the column with the trailing selection as such
                columnData[selectedItemInLastColumn ? (columnCount - 1) : (columnCount - 2)].trailingSelection = true;
            }
        }
        // append last column where there is no selection yet, unless the last selected item has no nested items or options of its own
        if (isNonEmptyObject(nextColumn)) {
            nextColumn.onSelect = onSelectInColumn(selectedItems.length);
            columnData.push(nextColumn);
        }
        // wrap the result into a new object in order to make this more easily extensible in the future
        return { columnData };
    };
}

/**
 * Check whether a given JsonSchema has any nested properties or is an array.
 *
 * @param {JsonSchema} schema single schema instance to check in (ignoring any nested sub schemas, e.g. `allOf`/`oneOf`/`anyOf`)
 * @return {Boolean} return whether any properties are mentioned or `schema` represents an array with items of a certain type
 */
function hasSchemaNestedItems(schema) {
    const { schema: rawSchema } = schema;
    const { properties, required, items, additionalItems } = rawSchema;
    return isNonEmptyObject(properties)
        || required
        || isNonEmptyObject(items)
        || isNonEmptyObject(additionalItems);
}

/**
 * Check whether a given JsonSchemaGroup has any nested properties, is an array or contains selectable optional sub-schemas.
 *
 * @param {JsonSchemaGroup} schemaGroup single schema group instance to check in
 * @return {Boolean} return whether any properties are mentioned, it represents an array with items of a certain type or contains selectable options
 */
export function hasSchemaGroupNestedItems(schemaGroup, optionIndexes) {
    return schemaGroup.someEntry(hasSchemaNestedItems, createOptionTargetArrayFromIndexes(optionIndexes))
        || (!optionIndexes && getOptionsInSchemaGroup(schemaGroup).options);
}

const optionShape = {
    groupTitle: PropTypes.string
};
optionShape.options = PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.shape({}), PropTypes.shape(optionShape)])).isRequired;

/**
 * Proptype validation of the `contextGroup` prop (and the related `options`/`items` props).
 *
 * @param {Object} param0 props
 * @param {?JsonSchemaGroup} param0.contextGroup group to validate
 * @param {?Object} param0.options representation of options within the `contextGroup`
 * @param {?Object} param0.items list of selectable entries being listed (i.e. properties/options/array-item-accessors)
 * @return {Error|null} validation error or null if validation is successful
 */
function contextGroupValidator({ contextGroup, options, items }) {
    if (isDefined(contextGroup) && !(contextGroup instanceof JsonSchemaGroup)) {
        return new Error("`contextGroup` is not a JsonSchemaGroup");
    }
    if (isNonEmptyObject(options) !== isDefined(contextGroup)) {
        return new Error("`options` and `contextGroup` are expected to be both set or not at the same time");
    }
    if (isNonEmptyObject(items) === isNonEmptyObject(options)) {
        return new Error("exactly one of `items` or `options` should be provided");
    }
    return null;
}

/**
 * PropType validation of the `selectedItem` prop.
 *
 * @param {Object} param0 props
 * @param {?String|Array.<Number>} param0.selectedItem name of the selected property/array-item-accessor or array of option indexes
 * @return {Error|null} validation error or null if validation is successful
 */
function selectedItemValidator({ selectedItem }) {
    if (isDefined(selectedItem)
        && typeof selectedItem !== "string"
        && !(
            Array.isArray(selectedItem) && selectedItem.length && selectedItem.every(arrayEntry => typeof arrayEntry === "number")
        )) {
        return new Error("`selectedItem` is not a string or array of numbers");
    }
    // assume all ok
    return null;
}

/**
 * PropType validation of the `trailingSelection` prop (and the related `selectedItem` prop).
 *
 * @param {Object} param0 props
 * @param {?String|Array.<Number>} param0.selectedItem name of the selected property/array-item-accessor or array of option indexes
 * @param {?Boolean} param0.trailingSelection flag indicating whether the `selectedItem` is the last selection (i.e. in the right-most column)
 * @return {Error|null} validation error or null if validation is successful
 */
function trailingSelectionValidator({ selectedItem, trailingSelection }) {
    if (isDefined(trailingSelection) && typeof trailingSelection !== "boolean") {
        return new Error("`trailingSelection` is not a boolean");
    }
    if (trailingSelection && !selectedItem) {
        return new Error("`trailingSelection` is true while there is no `selectedItem`");
    }
    return null;
}

/**
 * PropType validation of the `filteredItems` prop.
 *
 * @param {Object} param0 props
 * @param {?Array.<String>|Array.<Array.<Number>>} param0.filteredItems names of properties/options/array-item-accessors matchign the search filter
 * @param {?Object} param0.options representation of options within the `contextGroup`
 * @param {?Object} param0.items list of selectable entries being listed (i.e. properties/options/array-item-accessors)
 * @return {Error|null} validation error or null if validation is successful
 */
function filteredItemsValidator({ items, options, filteredItems }) {
    if (isDefined(filteredItems)) {
        if (!Array.isArray(filteredItems)) {
            return new Error("`filteredItems` is not an `array`");
        }
        if (items && filteredItems.some(singleItem => !items[singleItem])) {
            return new Error("`filteredItems` are not all part of `items`");
        }
        if (options && !filteredItems.every(singleOption => isOptionIndexValidForOptions(singleOption, options))) {
            return new Error("`filteredItems` are not all part of index combinations derived from `options`");
        }
    }
    return null;
}

/**
 * Shape for PropType validation of a single entries in the standard `columnData` array generated by a created render-data-builder.
 *
 * @param {?Boolean} includeOnSelect flag indicating whether `onSelect` should be treated as required
 * @return {Object} return `columnData` shape for PropType validation
 */
export function getColumnDataPropTypeShape(includeOnSelect = true) {
    return {
        items: PropTypes.objectOf(PropTypes.instanceOf(JsonSchemaGroup)),
        options: PropTypes.shape(optionShape),
        contextGroup: contextGroupValidator,
        selectedItem: selectedItemValidator,
        trailingSelection: trailingSelectionValidator,
        filteredItems: filteredItemsValidator,
        onSelect: includeOnSelect ? PropTypes.func.isRequired : PropTypes.func // func(SyntheticEvent: event, string|array<number>: identifier)
    };
}

/**
 * Create a function that returns the list of `filteredItems` for a given entry in the standard `columnData` array.
 *
 * @param {Function} flatSearchFilter function determining whether a given raw json schema matches some search filter
 * @param {Object} flatSearchFilter.param0 raw json schema
 * @param {Boolean} flatSearchFilter.return indication whether raw json schema is matching search filter
 * @return {Function} return function that returns the list of `filteredItems` for a given entry in the standard `columnData` array
 * @return {Object} return.param0 entry in `columnData` array to check
 * @return {?JsonSchemaGroup} return.param0.contextGroup json schema group containing options to select from
 * @return {?Object} return.param0.options representation of options within the `contextGroup`
 * @return {?Object} return.param0.items list of selectable entries being listed (i.e. properties/options/array-item-accessors)
 * @return {?Array.<String>|Array.<Array.<Number>>} return.return names of properties/options/array-item-accessors matchign the search filter
 */
export function createFilterFunctionForColumn(flatSearchFilter) {
    const containsMatchingItems = createFilterFunctionForSchema(flatSearchFilter);
    return ({ items, options, contextGroup }) => {
        if (isNonEmptyObject(items)) {
            return Object.keys(items).filter(key => items[key].someEntry(containsMatchingItems));
        }
        return getIndexPermutationsForOptions(options)
            .filter(optionIndexes => contextGroup.someEntry(containsMatchingItems, createOptionTargetArrayFromIndexes(optionIndexes)));
    };
}
