import PropTypes from "prop-types";

import JsonSchema from "../model/JsonSchema";
import JsonSchemaGroup from "../model/JsonSchemaGroup";
import {
    createGroupFromSchema, getPropertiesFromSchemaGroup, getTypeOfArrayItemsFromSchemaGroup,
    createOptionTargetArrayFromIndexes, getOptionsInSchemaGroup, getIndexPermutationsForOptions
} from "../model/schemaUtils";
import { isDefined, isNonEmptyObject, mapObjectValues } from "../model/utils";
import { createFilterFunctionForSchema } from "../model/searchUtils";

/**
 * Check whether a given array of indexes corresponds to an existing path in the `options` hierarchy.
 *
 * @param {Array.<number>} optionIndexes - indexes representing a single selection path in the `options` hierarchy
 * @param {{groupTitle: ?string, options: Array.<object>}} options - representation of the hierarchical structure of optional sub schemas
 * @returns {boolean} whether given `optionIndexes` represent a valid option path
 */
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

/**
 * Create the root entry of the standard `columnData` array.
 *
 * @param {object} schemas - named raw schemas to list in root `columnData` entry
 * @param {Array.<object>} referenceSchemas - additional schemas that may be referenced
 * @param {?object} parserConfig - settings determining how a json schema is being traversed/parsed
 * @returns {object.<string, JsonSchemaGroup>} named schema groups, derived from the provided raw schemas
 */
function createRootColumnData(schemas, referenceSchemas, parserConfig = {}) {
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
        referenceScopes.forEach((referenceScope) => schema.scope.addOtherScope(referenceScope));
        return createGroupFromSchema(schema);
    });
    return { items: rootColumnItems };
}

/**
 * Provide default array accessor function.
 *
 * @param {JsonSchema} arrayItemSchema - declared type of items in an array (as per the respective json schema)
 * @returns {{"[0]": JsonSchema}} simple object allowing to access the array's item definition via a single entry
 */
function buildDefaultArrayProperties(arrayItemSchema) {
    return { "[0]": arrayItemSchema };
}

/**
 * @name ArrayPropertiesBuilder
 * @function
 * @param {JsonSchema} param0 - declared type of the array's items
 * @param {JsonSchemaGroup} param1 - schema group representing the array
 * @param {?Array.<Array.<number>>} param2 - selected optionIndexes in `param1` (if the array's schema group contains options)
 * @returns {object.<string, JsonSchema|object>} object containing the selectable items for an array, e.g. for accessing an item
 */
/**
 * Create an entry for the standard `columnData` array.
 *
 * @param {JsonSchemaGroup} schemaGroup - selected schema group (in previous column)
 * @param {?Array.<number>} optionIndexes - selected option path in `schemaGroup`
 * @param {?ArrayPropertiesBuilder} buildArrayProperties - function for building dynamic sub schema based on declared array item type
 * @returns {object} `columnData` entry
 */
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
            buildArrayProperties(nestedArrayItemSchema, schemaGroup, optionIndexes),
            (propertyValue) => (
                propertyValue instanceof JsonSchema ? propertyValue : new JsonSchema(propertyValue, nestedArrayItemSchema.parserConfig)
            )
        );

        return {
            items: mapObjectValues(arrayProperties, createGroupFromSchema)
        };
    }
    return {};
}

/**
 * @name RenderDataBuilder
 * @function
 * @param {object.<string, object>} param0 - mapped raw schemas to be listed in the root column
 * @param {Array.<object>} param1 - additional raw schemas that may be referenced but are not listed (directly) in the root column
 * @param {Array.<string|Array.<number>>} param2 - currently selected elements in the respective columns
 * @param {?object} param3 - `parserConfig` object indicating how the schemas should be traversed/parsed
 * @param {?ArrayPropertiesBuilder} param4 - function for building an array's properties
 * @returns {{columnData: Array.<object>}} render data
 */
/**
 * Create a function for constructing the render data to be used throughout the whole component.
 *
 * @param {Function} onSelectInColumn - function for creating the onSelect call-back for a single column
 * @param {number} onSelectInColumn.param0 - index of the column for which to provide the onSelect call-back
 * @param {Function} onSelectInColumn.return - onSelect call-back for the column at the indicated index
 * @returns {RenderDataBuilder} function for building the standard render data used throughout the component
 */
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
 * @param {JsonSchema} schema - single schema instance to check in (ignoring any nested sub schemas, e.g. `allOf`/`oneOf`/`anyOf`)
 * @returns {boolean} whether any properties are mentioned or `schema` represents an array with items of a certain type
 */
function hasSchemaNestedItems(schema) {
    const { schema: rawSchema } = schema;
    const {
        properties, required, items, additionalItems
    } = rawSchema;
    return isNonEmptyObject(properties)
        || required
        || isNonEmptyObject(items)
        || isNonEmptyObject(additionalItems);
}

/**
 * Check whether a given JsonSchemaGroup has any nested properties, is an array, or contains selectable optional sub-schemas.
 *
 * @param {JsonSchemaGroup} schemaGroup - single schema group instance to check in
 * @param {Array.<number>} optionIndexes - indexes of selected options
 * @returns {boolean} whether any properties are mentioned, it represents an array with items of a certain type or contains selectable options
 */
export function hasSchemaGroupNestedItems(schemaGroup, optionIndexes) {
    return schemaGroup.someEntry(hasSchemaNestedItems, createOptionTargetArrayFromIndexes(optionIndexes))
        || (!optionIndexes && getOptionsInSchemaGroup(schemaGroup).options)
        || false;
}

const optionShape = {
    groupTitle: PropTypes.string
};
optionShape.options = PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.shape({}), PropTypes.shape(optionShape)])).isRequired;

/**
 * PropType validation of the `contextGroup` prop (and the related `options`/`items` props).
 *
 * @param {object} param0 - props
 * @param {?JsonSchemaGroup} param0.contextGroup - group to validate
 * @param {?object} param0.options - representation of options within the `contextGroup`
 * @param {?object} param0.items - list of selectable entries being listed (i.e. properties/options/array-item-accessors)
 * @returns {?Error} validation error or null if validation is successful
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
 * @param {object} param0 - props
 * @param {?string|Array.<number>} param0.selectedItem - name of the selected property/array-item-accessor or array of option indexes
 * @returns {?Error} validation error or null if validation is successful
 */
function selectedItemValidator({ selectedItem }) {
    if (isDefined(selectedItem)
        && typeof selectedItem !== "string"
        && !(
            Array.isArray(selectedItem) && selectedItem.length && selectedItem.every((arrayEntry) => typeof arrayEntry === "number")
        )) {
        return new Error("`selectedItem` is not a string or array of numbers");
    }
    // assume all ok
    return null;
}

/**
 * PropType validation of the `trailingSelection` prop (and the related `selectedItem` prop).
 *
 * @param {object} param0 - props
 * @param {?string|Array.<number>} param0.selectedItem - name of the selected property/array-item-accessor or array of option indexes
 * @param {?boolean} param0.trailingSelection - flag indicating whether the `selectedItem` is the last selection (i.e. in the right-most column)
 * @returns {?Error} validation error or null if validation is successful
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
 * @param {object} param0 - props
 * @param {?Array.<string>|Array.<Array.<number>>} param0.filteredItems - names of properties/options/array-item-accessors matching the search filter
 * @param {?object} param0.options - representation of options within the `contextGroup`
 * @param {?object} param0.items - list of selectable entries being listed (i.e. properties/options/array-item-accessors)
 * @returns {?Error} validation error or null if validation is successful
 */
function filteredItemsValidator({ items, options, filteredItems }) {
    if (isDefined(filteredItems)) {
        if (!Array.isArray(filteredItems)) {
            return new Error("`filteredItems` is not an `array`");
        }
        if (items && filteredItems.some((singleItem) => !items[singleItem])) {
            return new Error("`filteredItems` are not all part of `items`");
        }
        if (options && !filteredItems.every((singleOption) => isOptionIndexValidForOptions(singleOption, options))) {
            return new Error("`filteredItems` are not all part of index combinations derived from `options`");
        }
    }
    return null;
}

/**
 * Shape for PropType validation of a single entries in the standard `columnData` array generated by a created render-data-builder.
 *
 * @param {?boolean} includeOnSelect - flag indicating whether `onSelect` should be treated as required
 * @returns {object} `columnData` shape for PropType validation
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
 * @name FilterFunctionForColumn
 * @function
 * @param {object} param0 - entry in `columnData` array to check
 * @param {?JsonSchemaGroup} param0.contextGroup - json schema group containing options to select from
 * @param {?object} param0.options - representation of options within the `contextGroup`
 * @param {?object} param0.items - list of selectable entries being listed (i.e. properties/options/array-item-accessors)
 * @returns {?Array.<string>|Array.<Array.<number>>} names of properties/options/array-item-accessors matching the search filter
 */
/**
 * Create a function that returns the list of `filteredItems` for a given entry in the standard `columnData` array.
 *
 * @param {?Function} flatSchemaFilterFunction - function that checks whether a given raw schema matches some search criteria
 * @param {object} flatSchemaFilterFunction.param0 - first input parameter is a raw schema definition
 * @param {?boolean} flatSchemaFilterFunction.param1 - second input parameter: flag indicating whether nested optionals should be considered
 * @param {*} flatSchemaFilterFunction.return - output is a truthy/falsy value, whether the given schema matches the filter (ignoring sub-schemas)
 * @param {?Function} propertyNameFilterFunction - check whether a given property name alone already satisfies the search criteria
 * @param {string} propertyNameFilterFunction.param0 - input parameter is the property name to check
 * @param {*} propertyNameFilterFunction.return - output is a truthy/falsy value, whether the property name matches some search criteria
 * @returns {FilterFunctionForColumn} function that returns the list of `filteredItems` for a given entry in the standard `columnData` array
 */
export function createFilterFunctionForColumn(flatSchemaFilterFunction, propertyNameFilterFunction = () => false) {
    const containsMatchingItems = createFilterFunctionForSchema(flatSchemaFilterFunction, propertyNameFilterFunction);
    return ({ items, options, contextGroup }) => {
        if (isNonEmptyObject(items)) {
            return Object.keys(items).filter((key) => propertyNameFilterFunction(key) || items[key].someEntry(containsMatchingItems));
        }
        return getIndexPermutationsForOptions(options)
            .filter((optionIndexes) => contextGroup.someEntry(containsMatchingItems, createOptionTargetArrayFromIndexes(optionIndexes)));
    };
}
