import PropTypes from "prop-types";
import React, { Component } from "react";
import memoize from "memoize-one";
import isDeepEqual from "lodash.isequal";

import "./Inspector.scss";

import InspectorColView from "./InspectorColView";
import InspectorDetails from "./InspectorDetails";
import JsonSchemaPropType from "./JsonSchemaPropType";
import {
    collectRefTargets, getPropertyParentSchemas, isNonEmptyObject, mergeObjects
} from "./utils";

class Inspector extends Component {
    constructor(props) {
        super(props);
        const { defaultSelectedItems } = props;
        // the state should be kept minimal, i.e. only identifying the selected items
        // the expensive logic is handled in getRenderDataForSelection()
        this.state = {
            selectedItems: defaultSelectedItems,
            appendEmptyColumn: false
        };

        this.onSelect = this.onSelect.bind(this);
    }

    /**
     * Collect the data to provide as props to the sub components.
     * Thanks to 'memoize', all this logic will only be executed again if the provided parameters changed.
     * @param schemas object containing the top-level JsonSchema definitions as values
     * @param selectedItems array of strings identifying the selected properties per column
     * @return object containing a 'refTargets' object - containing re-usable sub-schemas;
     *         and a 'columnData' array - each element being an object with the props expected by <InspectorColumn>
     */
    getRenderDataForSelection = memoize((schemas, selectedItems) => {
        const refTargets = selectedItems.length === 0 ? {} : collectRefTargets(schemas[selectedItems[0]]);
        // the first column always lists all top-level schemas
        let nextColumnScope = schemas;
        const lastSelectionIndex = selectedItems.length - 1;
        const columnData = selectedItems.map((selection, index) => {
            const currentColumnScope = nextColumnScope;
            if (currentColumnScope[selection]) {
                const schemaList = getPropertyParentSchemas(currentColumnScope[selection], refTargets);
                nextColumnScope = schemaList.map(part => part.properties).reduce(mergeObjects, undefined);
                return {
                    items: currentColumnScope, // mapped JsonSchema definitions to select from in this column
                    selectedItem: selection, // name of the selected item (i.e. key in 'items')
                    trailingSelection: lastSelectionIndex === index, // whether this is the last column with a selection
                    onSelect: this.onSelect(index)
                };
            }
            // the selection in the previous column refers to a schema that has no nested properties/items
            throw new Error(`invalid selection '${selection}' in column at index ${index}`);
        });
        // append last column where there is no selection yet, unless the last selected item has no nested items of its own
        if (isNonEmptyObject(nextColumnScope)) {
            columnData.push({
                items: nextColumnScope,
                selectedItem: null,
                trailingSelection: false,
                onSelect: this.onSelect(selectedItems.length)
            });
        }
        return { columnData, refTargets };
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
        const { schemas, onSelect } = this.props;
        const oldColumnCount = (appendEmptyColumn ? 1 : 0) + this.getRenderDataForSelection(schemas, selectedItems).columnData.length;
        // now we need to know what the number of content columns will be after changing the state
        // thanks to 'memoize', the subsequent render() call will just look-up the result of this evaluation
        const newRenderData = this.getRenderDataForSelection(schemas, newSelection);
        // update state to trigger rerendering of the whole component
        this.setState({
            selectedItems: newSelection,
            appendEmptyColumn: newRenderData.columnData.length < oldColumnCount
        }, onSelect ? () => onSelect(event, newSelection, newRenderData) : null);
    };

    render() {
        const {
            schemas, renderItemContent, renderSelectionDetails, renderEmptyDetails
        } = this.props;
        const { selectedItems, appendEmptyColumn } = this.state;
        const { columnData, refTargets } = this.getRenderDataForSelection(schemas, selectedItems);
        return (
            <div className="jsonschema-inspector jsonschema-inspector-container">
                <InspectorColView
                    columnData={columnData}
                    refTargets={refTargets}
                    appendEmptyColumn={appendEmptyColumn}
                    renderItemContent={renderItemContent}
                />
                <InspectorDetails
                    columnData={columnData}
                    refTargets={refTargets}
                    renderSelectionDetails={renderSelectionDetails}
                    renderEmptyDetails={renderEmptyDetails}
                />
            </div>
        );
    }
}

Inspector.propTypes = {
    /** allow multiple independent root schemas to inspect */
    schemas: PropTypes.objectOf(JsonSchemaPropType).isRequired,
    /** default selection identified by names of object properties */
    defaultSelectedItems: PropTypes.arrayOf(PropTypes.string),
    /** callback to invoke after the selection changed. func(event, newSelection, { columnData, refTargets }) */
    onSelect: PropTypes.func,
    /** func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema, refTargets }) */
    renderItemContent: PropTypes.func,
    /** func({ itemSchema: JsonSchema, columnData, refTargets, selectionColumnIndex: number }) */
    renderSelectionDetails: PropTypes.func,
    /** func({ rootColumnSchemas }) */
    renderEmptyDetails: PropTypes.func
};

Inspector.defaultProps = {
    defaultSelectedItems: [],
    onSelect: null,
    renderItemContent: null,
    renderSelectionDetails: null,
    renderEmptyDetails: null
};

export default Inspector;
