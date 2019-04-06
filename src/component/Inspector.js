import PropTypes from "prop-types";
import React, { Component } from "react";
import memoize from "memoize-one";
import debounce from "lodash.debounce";
import isDeepEqual from "lodash.isequal";

import "./Inspector.scss";

import InspectorColView from "./InspectorColView";
import InspectorDetails from "./InspectorDetails";
import InspectorBreadcrumbs from "./InspectorBreadcrumbs";
import InspectorSearchField from "./InspectorSearchField";
import JsonSchemaPropType from "./JsonSchemaPropType";

import { createRenderDataBuilder, createFilterFunctionForColumn } from "./renderDataUtils";
import createBreadcrumbBuilder from "../model/breadcrumbsUtils";
import { filteringByFields } from "../model/searchUtils";

class Inspector extends Component {
    /**
     * Avoid constant/immediate re-rendering while the search filter is being entered by using debounce.
     * This is wrapped into memoize() to allow setting the wait times via props.
     *
     * @param {Number} debounceWait the number of milliseconds to delay before applying the new filter value
     * @param {Number} debounceMaxWait the maximum time the filter re-evaluation is allowed to be delayed before it's invoked
     * @returns {Function} return debounced function to set applied filter
     * @returns {String} return.value input parameter is the new search filter value to apply
     */
    debouncedApplySearchFilter = memoize(
        (debounceWait, debounceMaxWait) => debounce(
            (newSearchFilter) => {
                this.setState({ appliedSearchFilter: newSearchFilter });
            },
            debounceWait,
            { maxWait: debounceMaxWait }
        )
    );

    constructor(props) {
        super(props);
        const { defaultSelectedItems } = props;

        // the state should be kept minimal
        // the expensive logic is handled in getRenderDataForSelection()
        this.state = {
            selectedItems: defaultSelectedItems,
            appendEmptyColumn: false,
            enteredSearchFilter: "",
            appliedSearchFilter: ""
        };
    }

    /**
     * When the entered search filter changes, store it in the component state and trigger the debounced re-evaluation of the actual filtering
     *
     * @param {String} enteredSearchFilter the newly entered search filter in its respective input field
     */
    onSearchFilterChange = (enteredSearchFilter) => {
        this.setState({ enteredSearchFilter });
        const { searchOptions } = this.props;
        const { debounceWait = 200, debounceMaxWait = 500 } = searchOptions;
        this.debouncedApplySearchFilter(debounceWait, debounceMaxWait)(enteredSearchFilter);
    };

    /**
     * Create an onSelect function for a particular column.
     *
     * @param {Number} columnIndex the index of the column to create the onSelect function for
     * @returns {Function} return the onSelect function to be used in that given column (for either setting or clearing its selection)
     * @returns {SyntheticEvent} return.param0.event the originally triggered event (e.g. onClick, onDoubleClick, onKeyDown, etc.)
     * @returns {String} return.param0.selectedItem the item to select (or `null` to discard any selection in this column – and all subsequent ones)
     */
    onSelectInColumn = columnIndex => (event, selectedItem) => {
        // the lowest child component accepting the click/selection event should consume it
        event.stopPropagation();
        const { selectedItems, appendEmptyColumn } = this.state;
        if (selectedItems.length === columnIndex && !selectedItem) {
            // click clearing selection in next column (where there was no selection yet)
            // i.e. no change = no need for any action
            return;
        }
        if (selectedItems.length === (columnIndex + 1) && isDeepEqual(selectedItems[columnIndex], selectedItem)) {
            // click on current/last selection
            // i.e. no change = no need for any action
            return;
        }
        // shallow-copy array of item identifiers
        const newSelection = selectedItems.slice();
        // discard any extraneous columns
        newSelection.length = columnIndex;
        // add the new selection in the targeted column (i.e. at the end), if a particular item was selected
        if (selectedItem) {
            newSelection.push(selectedItem);
        }
        // need to look-up the currently displayed number of content columns
        // thanks to 'memoize', we just look-up the result of the previous evaluation
        const {
            schemas, referenceSchemas, onSelect: onSelectProp, parserConfig, buildArrayProperties, breadcrumbs: breadcrumbsOptions
        } = this.props;
        const oldColumnCount = (appendEmptyColumn ? 1 : 0)
            + this.getRenderDataForSelection(schemas, referenceSchemas, selectedItems, parserConfig, buildArrayProperties).columnData.length;
        // now we need to know what the number of content columns will be after changing the state
        // thanks to 'memoize', the subsequent render() call will just look-up the result of this evaluation
        const newRenderData = this.getRenderDataForSelection(schemas, referenceSchemas, newSelection, parserConfig, buildArrayProperties);
        const { columnData } = newRenderData;
        // update state to trigger re-rendering of the whole component
        this.setState(
            {
                selectedItems: newSelection,
                appendEmptyColumn: columnData.length < oldColumnCount
            },
            onSelectProp
                // due to the two-step process, the newRenderData will NOT include the filteredItems
                ? () => onSelectProp(newSelection, newRenderData,
                    breadcrumbsOptions && columnData.map(createBreadcrumbBuilder(breadcrumbsOptions)).filter(value => value))
                // no call-back provided via props, nothing to do
                : undefined
        );
    };

    /**
     * Collect the data to provide as props to the sub components.
     * Thanks to 'memoize', all this logic will only be executed again if the provided parameters changed.
     *
     * @param {Object.<String, Object>} schemas object containing the top-level JsonSchema definitions as values
     * @param {?Array.<Object>} referenceSchemas
     * @param {?Array.<String>} selectedItems array of strings identifying the selected properties per column
     * @param {?Object} parserConfig configuration affecting how the JSON schemas are being traversed/parsed
     * @param {?Function} buildArrayProperties function to derive the properties to list for an array, based on a given `JsonSchema` of the items
     * @return {Object} return wrapper object for the column data (for the sake of future extensibility)
     * @return {Array.<Object>} return.columnData
     * @return {?Object.<String, JsonSchemaGroup>} return.columnData[].items named schemas to list in the respective column
     * @return {?Object} return.columnData[].options representation of a schema's hierarchy in case of optionals being included `"asAdditionalColumn"`
     * @return {?JsonSchemaGroup} return.columnData[].contextGroup the schema group containing the `options`
     * @return {?String} return.columnData[].selectedItem name of the currently selected item (may be null)
     * @return {?Boolean} return.columnData[].trailingSelection flag indicating whether this column's selection is the last
     * @return {Function} return.columnData[].onSelect callback expecting an event and the name of the selected item in that column as parameters
     */
    getRenderDataForSelection = memoize(createRenderDataBuilder(this.onSelectInColumn), isDeepEqual);

    /**
     * Provide setter for a single entry in the standard columnData array to set or clear its list of `filteredItems` according to the given
     * `searchOptions` (prop) and entered `searchFilter` value (from search input field).
     * Thanks to 'memoize', exactly one set of previous search results will be preserved if the options and filter value are unchanged.
     *
     * @param {?Object} searchOptions
     * @param {?Function} searchOptions.filterBy custom filter function to apply (expecting the `searchFilter` as input)
     * @param {?Array.<String>} searchOptions.fields alternative to `filterBy`, generating a filter function checking the listed fields' contents
     * @param {?String} searchFilter entered value from the search input field to filter by
     * @return {Function} return function to apply for setting/clearing the `filteredItems` in an entry of the 'columnData' array
     * @return {Object} return.param0 entry of the 'columnData' array to set/clear the `filteredItems` in
     */
    setFilteredItemsForColumn = memoize((searchOptions, searchFilter) => {
        if (searchOptions && searchFilter) {
            // search feature is enabled
            const { filterBy, fields } = searchOptions;
            // if `filterBy` is defined, `fields` are being ignored
            const flatFilterFunction = filterBy ? filterBy(searchFilter) : filteringByFields(fields, searchFilter);
            if (flatFilterFunction) {
                // search feature is being used, so we set the filteredItems accordingly
                const getFilteredItemsForColumn = createFilterFunctionForColumn(flatFilterFunction);
                return (column) => {
                    // eslint-disable-next-line no-param-reassign
                    column.filteredItems = getFilteredItemsForColumn(column);
                };
            }
        }
        // if the search feature is disabled or currently unused, we should ensure that there are no left-over filteredItems
        // eslint-disable-next-line no-param-reassign
        return column => delete column.filteredItems;
    }, isDeepEqual);

    render() {
        const {
            schemas, referenceSchemas, parserConfig, buildArrayProperties,
            searchOptions, breadcrumbs, renderItemContent, renderSelectionDetails, renderEmptyDetails
        } = this.props;
        const {
            selectedItems, appendEmptyColumn, enteredSearchFilter, appliedSearchFilter
        } = this.state;
        const { columnData } = this.getRenderDataForSelection(schemas, referenceSchemas, selectedItems, parserConfig, buildArrayProperties);
        // apply search filter if enabled or clear (potentially left-over) search results
        columnData.forEach(this.setFilteredItemsForColumn(searchOptions, appliedSearchFilter));
        const searchFeatureEnabled = searchOptions && ((searchOptions.fields && searchOptions.fields.length) || searchOptions.filterBy);
        return (
            <div className="jsonschema-inspector">
                {searchFeatureEnabled && (
                    <div className="jsonschema-inspector-header">
                        <InspectorSearchField
                            searchFilter={enteredSearchFilter}
                            onSearchFilterChange={this.onSearchFilterChange}
                            placeholder={searchOptions.inputPlaceholder}
                        />
                    </div>
                )}
                <div className="jsonschema-inspector-body">
                    <InspectorColView
                        columnData={columnData}
                        appendEmptyColumn={appendEmptyColumn}
                        renderItemContent={renderItemContent}
                    />
                    <InspectorDetails
                        columnData={columnData}
                        renderSelectionDetails={renderSelectionDetails}
                        renderEmptyDetails={renderEmptyDetails}
                    />
                </div>
                {breadcrumbs && (
                    <div className="jsonschema-inspector-footer">
                        <InspectorBreadcrumbs
                            columnData={columnData}
                            breadcrumbsOptions={breadcrumbs}
                        />
                    </div>
                )}
            </div>
        );
    }
}

Inspector.propTypes = {
    /**
     * Object containing names of root level items (as keys) each associated with their respective JSON Schema (as values).
     */
    schemas: PropTypes.objectOf(JsonSchemaPropType).isRequired,
    /**
     * Array of additional JSON Schemas that may be referenced by entries in `schemas` but are not shown (on the root level) themselves.
     */
    referenceSchemas: PropTypes.arrayOf(JsonSchemaPropType),
    /**
     * Array of (default) selected items – each item representing the selection in one displayed column.
     */
    defaultSelectedItems: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.number)])),
    /**
     * Options for the traversing/parsing of JSON schemas. Enabling the inclusion of optional part of a schema.
     */
    parserConfig: PropTypes.shape({
        /**
         * Setting indicating whether/how to include schema parts wrapped in "anyOf".
         */
        anyOf: PropTypes.shape({
            type: PropTypes.oneOf(["likeAllOf", "asAdditionalColumn"]).isRequired,
            groupTitle: PropTypes.string
        }),
        /**
         * Setting indicating whether/how to include schema parts wrapped in "oneOf".
         */
        oneOf: PropTypes.shape({
            type: PropTypes.oneOf(["likeAllOf", "asAdditionalColumn"]).isRequired,
            groupTitle: PropTypes.string
        })
    }),
    /**
     * Function accepting a `JsonSchema` instance representing an array's declared type of items and returning an object listing the available
     * properties to offer. The default, providing access to the array's items, is: `arrayItemSchema => ({ "[0]": arrayItemSchema })`
     */
    buildArrayProperties: PropTypes.func,
    /**
     * Options for the breadcrumbs feature shown in the footer – set to `null` to turn it off.
     * - "prefix": Text to show in front of root level selection, e.g. "//" or "./"
     * - "separator": Text to add between the selected item names from adjacent columns, e.g. "." or "/"
     * - "skipSeparator": Function to identify breadcrumb names that should not be prepended with a "separator"
     * - "mutateName": Function to derive the selected item's representation in the breadcrumbs from their name
     * - "preventNavigation": Flag indicating whether double-clicking an item should preserve subsequent selections, otherwise they are discarded
     */
    breadcrumbs: PropTypes.shape({
        prefix: PropTypes.string,
        separator: PropTypes.string,
        skipSeparator: PropTypes.func,
        mutateName: PropTypes.func,
        preventNavigation: PropTypes.bool
    }),
    /**
     * Options for the search input shown in the header and its impact on the displayed columns – set to `null` to turn it off.
     * - "fields": Array of strings: each referring to a textual field in a JSON Schema (e.g. `["title", "description"]`) in which to search/filter
     * - "filterBy": Custom search/filter logic, if present: overriding behaviour based on "fields" (either one must be set)
     * - "inputPlaceholder": Hint text to display in the search input field (defaults to "Search")
     * - "debounceWait": Number indicating the delay in milliseconds since the last change to the search term before applying it. Defaults to `200`.
     * - "debounceMaxWait": Number indicating the maximum delay in milliseconds before a newly entered search is being applied. Defaults to `500`.
     */
    searchOptions: PropTypes.shape({
        fields: PropTypes.arrayOf(PropTypes.string),
        filterBy: PropTypes.func,
        inputPlaceholder: PropTypes.string,
        debounceWait: PropTypes.number,
        debounceMaxWait: PropTypes.number
    }),
    /**
     * Callback to invoke after the selection changed.
     * Expects two inputs:
     * 1. the string-array of selected items
     * 2. object containing a "columnData" key, holding the full render information for all columns (except for currently applied search/filter)
     */
    onSelect: PropTypes.func,
    /**
     * Custom render function for the content of a single item in a column.
     * Expects a single object as input with the following keys:
     * - "identifier": providing the name of the respective item
     * - "hasNestedItems": flag indicating whether selecting this item may display another column with further options to the right
     * - "selected": flag indicating whether the item is currently selected
     * - "schemaGroup": the full `JsonSchemaGroup` associated with the item
     */
    renderItemContent: PropTypes.func,
    /**
     * Custom render function for the details block on the right (only used if there is an actual selection).
     * Expects a single object as input with the following keys:
     * - "itemSchemaGroup": the full `JsonSchemaGroup` associated with the currently selected trailing item (i.e. right-most selection)
     * - "columnData": the full render information for all columns
     * - "selectionColumnIndex": indicating the index of the right-most column containing a selected item (for more convenient use of "columnData")
     */
    renderSelectionDetails: PropTypes.func,
    /**
     * Custom render function for the details block on the right (only used if there is no selection).
     * Expects a single object as input with the following key:
     * - "rootColumnSchemas": the full render information for the root column (since there is no selection, there are no other columns)
     */
    renderEmptyDetails: PropTypes.func
};

Inspector.defaultProps = {
    referenceSchemas: [],
    defaultSelectedItems: [],
    parserConfig: {
        oneOf: { type: "asAdditionalColumn" },
        anyOf: { type: "asAdditionalColumn" }
    },
    buildArrayProperties: arrayItemSchema => ({ "[0]": arrayItemSchema }),
    breadcrumbs: {
        skipSeparator: fieldName => (fieldName === "[0]")
    },
    searchOptions: {
        fields: ["title", "description"]
    },
    onSelect: undefined,
    renderItemContent: undefined,
    renderSelectionDetails: undefined,
    renderEmptyDetails: undefined
};

export default Inspector;
