import PropTypes from "prop-types";
import React, { Component } from "react";
import memoize from "memoize-one";
import isDeepEqual from "lodash.isequal";

import "./Inspector.scss";

import InspectorColView from "./InspectorColView";
import InspectorDetails from "./InspectorDetails";
import InspectorBreadcrumbs from "./InspectorBreadcrumbs";
import InspectorSearchField from "./InspectorSearchField";
import JsonSchemaPropType from "./JsonSchemaPropType";
import JsonSchema from "./JsonSchema";
import { createFilterFunction } from "./searchUtils";
import { isDefined, isNonEmptyObject, mapObjectValues } from "./utils";

class Inspector extends Component {
    constructor(props) {
        super(props);
        const { defaultSelectedItems } = props;
        // the state should be kept minimal
        // the expensive logic is handled in getRenderDataForSelection()
        this.state = {
            selectedItems: defaultSelectedItems,
            appendEmptyColumn: false,
            searchFilter: null
        };
    }

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
                onSelect: this.onSelect(index)
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
                onSelect: this.onSelect(selectedItems.length)
            });
        }
        return { columnData };
    }, isDeepEqual);

    onSelect = columnIndex => (event, name) => {
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
        this.setState({
            selectedItems: newSelection,
            appendEmptyColumn: newRenderData.columnData.length < oldColumnCount
        }, onSelectProp ? () => onSelectProp(newSelection, newRenderData) : null);
    };

    onSearchFilterChange = (searchFilter) => {
        this.setState({ searchFilter });
    };

    render() {
        const {
            schemas, referenceSchemas, renderItemContent, renderSelectionDetails, renderEmptyDetails, search, breadcrumbs
        } = this.props;
        const { selectedItems, appendEmptyColumn, searchFilter } = this.state;
        let { columnData } = this.getRenderDataForSelection(schemas, referenceSchemas, selectedItems);
        const getFilteredItemsForColumn = search && createFilterFunction(search.fields, searchFilter);
        if (getFilteredItemsForColumn) {
            // preserve original columnData array to let memoize do its job for getRenderDataForSelection()
            columnData = columnData.map(column => ({
                ...column,
                // apply search filter
                filteredItems: getFilteredItemsForColumn(column.items)
            }));
        }
        return (
            <div className="jsonschema-inspector">
                {search && search.fields && (
                    <div className="jsonschema-inspector-header">
                        <InspectorSearchField
                            searchFilter={searchFilter}
                            onSearchFilterChange={this.onSearchFilterChange}
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
    search: PropTypes.shape({
        fields: PropTypes.arrayOf(PropTypes.string)
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
    search: undefined,
    onSelect: undefined,
    renderItemContent: undefined,
    renderSelectionDetails: undefined,
    renderEmptyDetails: undefined
};

export default Inspector;
