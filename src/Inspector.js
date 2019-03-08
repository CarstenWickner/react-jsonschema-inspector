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
import JsonSchema from "./JsonSchema";
import { createFilterFunction, filteringByFields } from "./searchUtils";
import { isDefined, isNonEmptyObject, mapObjectValues } from "./utils";

class Inspector extends Component {
    /**
     * Avoid constant/immediate rerendering while the search filter is being entered by using debounce.
     * This is wrapped into memoize() to allow setting the wait times via props.
     *
     * @param {Number} debounceWait the number of milliseconds to delay before applying the new filter value
     * @param {Number} debounceMxWait the maximum time the filter reevaluation is allowed to be delayed before it’s invoked
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
     * When the entered search filter changes, store it in the component state and trigger the debounced reevaluation of the actual filtering
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
     * Collect the data to provide as props to the sub components.
     * Thanks to 'memoize', all this logic will only be executed again if the provided parameters changed.
     *
     * @param {Object.<String, Object>} schemas object containing the top-level JsonSchema definitions as values
     * @param {Array.<Object>} referenceSchemas
     * @param {Array.<String>} selectedItems array of strings identifying the selected properties per column
     * @return {Object}
     * @return {Array.<Object>} return.columnData
     * @return {Object.<String, JsonSchema>} return.columnData[].items named schemas to list in the respective column
     * @return {String} return.columnData[].selectedItem name of the currently selected item (may be null)
     * @return {Boolean} return.columnData[].trailingSelection flag indicating whether this column's selection is the last
     * @return {Function} return.columnData[].onSelect callback expecting an event and the name of the selected item in that column as parameters
     */
    getRenderDataForSelection = memoize((schemas, referenceSchemas, selectedItems) => {
        // first prepare those schemas that may be referenced by the displayed ones
        const referenceScopes = [];
        referenceSchemas.forEach((rawRefSchema) => {
            const refScope = new JsonSchema(rawRefSchema).scope;
            refScope.addOtherScopes(referenceScopes);
            referenceScopes.forEach(otherScope => otherScope.addOtherScope(refScope));
            referenceScopes.push(refScope);
        });
        // the first column always lists all top-level schemas
        let nextColumn = mapObjectValues(schemas, (rawSchema) => {
            const schema = new JsonSchema(rawSchema);
            schema.scope.addOtherScopes(referenceScopes);
            return schema;
        });
        const columnData = selectedItems.map((selection, index) => {
            const currentColumn = nextColumn;
            const isValidSelection = isDefined(currentColumn[selection]);
            nextColumn = isValidSelection ? currentColumn[selection].getProperties() : {};
            return {
                items: currentColumn, // mapped JsonSchema definitions to select from in this column
                selectedItem: isValidSelection ? selection : null, // name of the selected item (i.e. key in 'items')
                onSelect: this.onSelectInColumn(index)
            };
        }).filter(({ items }) => isNonEmptyObject(items));
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
        // append last column where there is no selection yet, unless the last selected item has no nested items of its own
        if (isNonEmptyObject(nextColumn)) {
            columnData.push({
                items: nextColumn,
                onSelect: this.onSelectInColumn(selectedItems.length)
            });
        }
        // wrap the result into a new object in order to make this more easily extendable in the future
        return { columnData };
    }, isDeepEqual);

    /**
     * Create an onSelect function for a particular column.
     *
     * @param {Number} columnIndex the index of the column to create the onSelect function for
     * @returns {Function} return the onSelect function to be used in that given column (for either setting or clearing its selected item)
     * @returns {SyntheticEvent} return.value.event the originally triggered event (e.g. onClick, onDoubleClick, onKeyDown, etc.)
     * @returns {String} return.value.name the item to select (or `null` to discard any selection in this column -- and all subsequent ones)
     */
    onSelectInColumn = columnIndex => (event, name) => {
        // the lowest child component accepting the click/selection event should consume it
        event.stopPropagation();
        const { selectedItems, appendEmptyColumn } = this.state;
        if (selectedItems.length === columnIndex && !name) {
            // click clearing selection in next column (where there was no selection yet)
            // i.e. no change = no need for any action
            return;
        }
        if (selectedItems.length === (columnIndex + 1) && selectedItems[columnIndex] === name) {
            // click on current/last selection
            // i.e. no change = no need for any action
            return;
        }
        // shallow-copy array of item identifiers (i.e. strings)
        const newSelection = selectedItems.slice();
        // discard any extraneous columns
        newSelection.length = columnIndex;
        // add the new selection in the targeted column (i.e. at the end), if a particular item was selected
        if (name) {
            newSelection.push(name);
        }
        // need to look-up the currently displayed number of content columns
        // thanks to 'memoize', we just look-up the result of the previous evaluation
        const { schemas, referenceSchemas, onSelect: onSelectProp } = this.props;
        const oldColumnCount = (appendEmptyColumn ? 1 : 0)
            + this.getRenderDataForSelection(schemas, referenceSchemas, selectedItems).columnData.length;
        // now we need to know what the number of content columns will be after changing the state
        // thanks to 'memoize', the subsequent render() call will just look-up the result of this evaluation
        const newRenderData = this.getRenderDataForSelection(schemas, referenceSchemas, newSelection);
        // update state to trigger rerendering of the whole component
        this.setState(
            {
                selectedItems: newSelection,
                appendEmptyColumn: newRenderData.columnData.length < oldColumnCount
            },
            onSelectProp
                // due to the two-step process, the newRenderData will NOT include the filteredItems
                ? () => onSelectProp(newSelection, newRenderData)
                // no call-back provided via props, nothing to do
                : undefined
        );
    };

    setFilteredItemsForColumn = memoize((searchOptions, searchFilter) => {
        if (searchOptions && searchFilter) {
            // search feature is enabled
            const { filterBy, fields } = searchOptions;
            // if `filterBy` is defined, `fields` are being ignored
            const flatFilterFunction = filterBy ? filterBy(searchFilter) : filteringByFields(fields, searchFilter);
            if (flatFilterFunction) {
                // search feature is being used, so we set the filteredItems accordingly
                const getFilteredItemsForColumn = createFilterFunction(flatFilterFunction);
                return (column) => {
                    // eslint-disable-next-line no-param-reassign
                    column.filteredItems = getFilteredItemsForColumn(column.items);
                };
            }
        }
        // if the search feature is disabled or currently unused, we should ensure that there are no left-over filteredItems
        // eslint-disable-next-line no-param-reassign
        return column => delete column.filteredItems;
    }, isDeepEqual);

    render() {
        const {
            schemas, referenceSchemas, renderItemContent, renderSelectionDetails, renderEmptyDetails, searchOptions, breadcrumbs
        } = this.props;
        const {
            selectedItems, appendEmptyColumn, enteredSearchFilter, appliedSearchFilter
        } = this.state;
        const { columnData } = this.getRenderDataForSelection(schemas, referenceSchemas, selectedItems);
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
                            {...breadcrumbs}
                        />
                    </div>
                )}
            </div>
        );
    }
}

Inspector.propTypes = {
    /** allow multiple independent root schemas to inspect */
    schemas: PropTypes.objectOf(JsonSchemaPropType).isRequired,
    referenceSchemas: PropTypes.arrayOf(JsonSchemaPropType),
    /** default selection identified by names of object properties */
    defaultSelectedItems: PropTypes.arrayOf(PropTypes.string),
    /** options for the breadcrumbs shown in the footer, can be turned off by setting to null */
    breadcrumbs: PropTypes.shape({
        prefix: PropTypes.string, // e.g. "//" or "./"
        separator: PropTypes.string, // e.g. "." or "/"
        arrayItemAccessor: PropTypes.string, // e.g. "[0]" or ".get(0)"
        preventNavigation: PropTypes.bool // whether double-clicking an item should preserve following selections, otherwise they are discarded
    }),
    /** list of field names to consider when performing the search */
    searchOptions: PropTypes.shape({
        fields: PropTypes.arrayOf(PropTypes.string),
        filterBy: PropTypes.func,
        debounceWait: PropTypes.number,
        debounceMaxWait: PropTypes.number,
        inputPlaceholder: PropTypes.string
    }),
    /** callback to invoke after the selection changed. func(newSelection, { columnData, refScope }) */
    onSelect: PropTypes.func,
    /** func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema, refScope }) */
    renderItemContent: PropTypes.func,
    /** func({ itemSchema: JsonSchema, columnData, refScope, selectionColumnIndex: number }) */
    renderSelectionDetails: PropTypes.func,
    /** func({ rootColumnSchemas }) */
    renderEmptyDetails: PropTypes.func
};

Inspector.defaultProps = {
    referenceSchemas: [],
    defaultSelectedItems: [],
    breadcrumbs: {},
    searchOptions: undefined,
    onSelect: undefined,
    renderItemContent: undefined,
    renderSelectionDetails: undefined,
    renderEmptyDetails: undefined
};

export default Inspector;
