import * as PropTypes from "prop-types";

import { JsonSchema, RefScope } from "../model/JsonSchema";
import { JsonSchemaGroup } from "../model/JsonSchemaGroup";
import { JsonSchemaOptionalsGroup } from "../model/JsonSchemaOptionalsGroup";
import {
    createGroupFromSchema,
    createOptionTargetArrayFromIndexes,
    getIndexPermutationsForOptions,
    getOptionsInSchemaGroup,
    getPropertiesFromSchemaGroup,
    getTypeOfArrayItemsFromSchemaGroup
} from "../model/schemaUtils";
import { isDefined, isNonEmptyObject, mapObjectValues } from "../model/utils";
import { createFilterFunctionForSchema } from "../model/searchUtils";
import {
    BuildArrayPropertiesFunction,
    ParserConfig,
    RenderColumn,
    RenderColumnOnSelectFunction,
    RenderOptionsColumn,
    RenderItemsColumn,
    RenderOptions
} from "../types/Inspector";
import { RawJsonSchema } from "../types/RawJsonSchema";

/**
 * Check whether a given array of indexes corresponds to an existing path in the `options` hierarchy.
 *
 * @param {Array.<number>} optionIndexes - indexes representing a single selection path in the `options` hierarchy
 * @param {{groupTitle: ?string, options: Array.<object>}} options - representation of the hierarchical structure of optional sub schemas
 * @returns {boolean} whether given `optionIndexes` represent a valid option path
 */
function isOptionIndexValidForOptions(optionIndexes: Array<number>, options: RenderOptions): boolean {
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
function createRootColumnData(
    schemas: { [key: string]: RawJsonSchema },
    referenceSchemas: Array<RawJsonSchema>,
    parserConfig: ParserConfig
): RenderItemsColumn {
    // first prepare those schemas that may be referenced by the displayed ones or each other
    const referenceScopes: Array<RefScope> = [];
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
function buildDefaultArrayProperties(arrayItemSchema: JsonSchema): { [key: string]: JsonSchema | RawJsonSchema } {
    return { "[0]": arrayItemSchema };
}

/**
 * Create an entry for the standard `columnData` array.
 *
 * @param {JsonSchemaGroup} schemaGroup - selected schema group (in previous column)
 * @param {?Array.<number>} optionIndexes - selected option path in `schemaGroup`
 * @param {?BuildArrayPropertiesFunction} buildArrayProperties - function for building dynamic sub schema based on declared array item type
 * @returns {object} `columnData` entry
 */
function buildNextColumn(
    schemaGroup: JsonSchemaGroup,
    optionIndexes?: Array<number>,
    buildArrayProperties: BuildArrayPropertiesFunction = buildDefaultArrayProperties
): RenderColumn | {} {
    if (!optionIndexes) {
        const options = getOptionsInSchemaGroup(schemaGroup);
        if (options.options) {
            // next column should offer the selection of options within the schema group
            return {
                contextGroup: schemaGroup as JsonSchemaOptionalsGroup,
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
        const arrayProperties = mapObjectValues(buildArrayProperties(nestedArrayItemSchema, schemaGroup, optionIndexes), (propertyValue) =>
            propertyValue instanceof JsonSchema ? (propertyValue as JsonSchema) : new JsonSchema(propertyValue, nestedArrayItemSchema.parserConfig)
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
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createRenderDataBuilder = (onSelectInColumn: (columnIndex: number) => RenderColumnOnSelectFunction) => (
    schemas: { [key: string]: RawJsonSchema },
    referenceSchemas: undefined | Array<RawJsonSchema>,
    selectedItems: Array<string | Array<number>>,
    parserConfig: ParserConfig,
    buildArrayProperties?: BuildArrayPropertiesFunction
) => {
    // the first column always lists all top-level schemas
    let nextColumn: RenderColumn | {} = createRootColumnData(schemas, referenceSchemas, parserConfig);
    let selectedSchemaGroup: JsonSchemaGroup;
    const columnData = selectedItems
        .map((selection, index) => {
            const currentColumn = nextColumn;
            const isOptionSelection = typeof selection !== "string";
            let isValidSelection: boolean;
            if (isOptionSelection && selectedSchemaGroup && (currentColumn as RenderOptionsColumn).options) {
                isValidSelection = isOptionIndexValidForOptions(selection as Array<number>, (currentColumn as RenderOptionsColumn).options);
            } else if (!isOptionSelection && (currentColumn as RenderItemsColumn).items) {
                selectedSchemaGroup = (currentColumn as RenderItemsColumn).items[selection as string];
                isValidSelection = isDefined(selectedSchemaGroup);
            }
            if (isValidSelection) {
                nextColumn = buildNextColumn(selectedSchemaGroup, isOptionSelection ? (selection as Array<number>) : undefined, buildArrayProperties);
                if (isOptionSelection) {
                    selectedSchemaGroup = null;
                }
            } else {
                nextColumn = {};
            }
            // name of the selected item (i.e. key in 'items') or int array of option indexes
            (currentColumn as RenderColumn).selectedItem = isValidSelection ? selection : null;
            (currentColumn as RenderColumn).onSelect = onSelectInColumn(index);
            return currentColumn as RenderColumn;
        })
        .filter((column) => (column as RenderItemsColumn).items || (column as RenderOptionsColumn).options);
    // set the flag for the last column containing a valid selection
    const columnCount = columnData.length;
    if (columnCount) {
        // there is at least one column, check whether the last column has a valid selection
        const selectedItemInLastColumn = columnData[columnCount - 1].selectedItem;
        // if the last column has no valid selection, the second to last column must have one
        if (selectedItemInLastColumn || columnCount > 1) {
            // there is at least one column with a valid selection, mark the column with the trailing selection as such
            columnData[selectedItemInLastColumn ? columnCount - 1 : columnCount - 2].trailingSelection = true;
        }
    }
    // append last column where there is no selection yet, unless the last selected item has no nested items or options of its own
    if (isNonEmptyObject(nextColumn)) {
        (nextColumn as RenderColumn).onSelect = onSelectInColumn(selectedItems.length);
        columnData.push(nextColumn as RenderColumn);
    }
    // wrap the result into a new object in order to make this more easily extensible in the future
    return { columnData };
};

/**
 * Check whether a given JsonSchema has any nested properties or is an array.
 *
 * @param {JsonSchema} schema - single schema instance to check in (ignoring any nested sub schemas, e.g. `allOf`/`oneOf`/`anyOf`)
 * @returns {boolean} whether any properties are mentioned or `schema` represents an array with items of a certain type
 */
function hasSchemaNestedItems(schema: JsonSchema): boolean {
    const { schema: rawSchema } = schema;
    const { properties, required, items, additionalItems } = rawSchema;
    return isNonEmptyObject(properties) || !!required || isNonEmptyObject(items) || isNonEmptyObject(additionalItems);
}

/**
 * Check whether a given JsonSchemaGroup has any nested properties, is an array, or contains selectable optional sub-schemas.
 *
 * @param {JsonSchemaGroup} schemaGroup - single schema group instance to check in
 * @param {Array.<number>} optionIndexes - indexes of selected options
 * @returns {boolean} whether any properties are mentioned, it represents an array with items of a certain type or contains selectable options
 */
export function hasSchemaGroupNestedItems(schemaGroup: JsonSchemaGroup, optionIndexes?: Array<number>): boolean {
    return (
        schemaGroup.someEntry(hasSchemaNestedItems, createOptionTargetArrayFromIndexes(optionIndexes)) ||
        (!optionIndexes && !!getOptionsInSchemaGroup(schemaGroup).options)
    );
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
export function createFilterFunctionForColumn(
    flatSchemaFilterFunction: (rawSchema: RawJsonSchema, includeNestedOptionals?: boolean) => boolean,
    propertyNameFilterFunction: (name: string) => boolean = (): boolean => false
): (column: RenderColumn) => Array<string> | Array<Array<number>> {
    const containsMatchingItems = createFilterFunctionForSchema(flatSchemaFilterFunction, propertyNameFilterFunction);
    return (column: RenderColumn): Array<string> | Array<Array<number>> => {
        const { items } = column as RenderItemsColumn;
        if (isNonEmptyObject(items)) {
            return Object.keys(items).filter((key) => propertyNameFilterFunction(key) || items[key].someEntry(containsMatchingItems));
        }
        const { options, contextGroup } = column as RenderOptionsColumn;
        return getIndexPermutationsForOptions(options).filter((optionIndexes) =>
            contextGroup.someEntry(containsMatchingItems, createOptionTargetArrayFromIndexes(optionIndexes))
        );
    };
}

export const RenderItemsColumnPropTypeShape = {
    trailingSelection: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    items: PropTypes.objectOf(PropTypes.instanceOf(JsonSchemaGroup)).isRequired,
    selectedItem: PropTypes.string,
    filteredItems: PropTypes.arrayOf(PropTypes.string)
};

const RenderOptionsPropTypeShape = {
    groupTitle: PropTypes.string,
    options: PropTypes.array,
    optionNameForIndex: PropTypes.func,
    filteredItems: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
};
RenderOptionsPropTypeShape.options = PropTypes.arrayOf(PropTypes.shape(RenderOptionsPropTypeShape));

export const RenderOptionsColumnPropTypeShape = {
    trailingSelection: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    options: PropTypes.shape(RenderOptionsPropTypeShape).isRequired,
    selectedItem: PropTypes.arrayOf(PropTypes.number),
    contextGroup: PropTypes.instanceOf(JsonSchemaGroup).isRequired
};

export const ColumnDataPropType = PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.shape(RenderItemsColumnPropTypeShape), PropTypes.shape(RenderOptionsColumnPropTypeShape)])
);
