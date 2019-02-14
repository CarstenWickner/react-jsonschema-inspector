import PropTypes from 'prop-types';
import React, { Component } from 'react';
import memoize from 'memoize-one';

import './Inspector.css';

import InspectorColumn from './InspectorColumn';
import JsonSchemaPropType from './JsonSchemaPropType';
import { getNestedProperties } from './utils';

class Inspector extends Component {

    constructor(props) {
        super(props);
        const { defaultSelectedItems } = props;
        // the state should be kept minimal, i.e. only identifying the selected items
        // the expensive logic is handled in getRenderDataForSelection()
        this.state = {
            selectedItems: defaultSelectedItems
        };

        this.renderColumn = this.renderColumn.bind(this);
    }

    /**
     * Collect the data to provide as props to the sub components.
     * Thanks to memoize(), all this logic will only be executed again if the provided parameters changed.
     * @param schemas object containing the top-level JsonSchema definitions as values
     * @param selectedItems array of strings identifying the selected properties per column
     * @return object containing a 'columnData' array - each element being an object with the props expected by <InspectorColumn>
     */
    getRenderDataForSelection = memoize((schemas, selectedItems) => {
        // the first column always lists all top-level schemas
        let nextColumnScope = schemas;
        const lastSelectionIndex = selectedItems.length - 1;
        const columnData = selectedItems.map((selection, index) => {
            const currentColumnScope = nextColumnScope;
            if (currentColumnScope) {
                nextColumnScope = getNestedProperties(currentColumnScope[selection]);
                return {
                    items: currentColumnScope, // mapped JsonSchema definitions to select from in this column
                    selectedItem: selection, // name of the selected item (i.e. key in 'items')
                    trailingSelection: lastSelectionIndex === index, // whether this is the last column with a selection
                    onSelect: this.onSelect(index)
                };
            }
            // the selection in the previous column refers to a schema that has no nested properties/items
            // throw new Error('invalid selection "' + selectedItems[index - 1] + '" in column at index ' + (index - 1));
            throw new Error('invalid selection in column at index ' + (index - 1));
        });
        // avoid appending an empty column if the selected item in the last column has no nested items to offer
        if (typeof nextColumnScope === 'object' && nextColumnScope !== null) {  
            // include the next level of properties to select from     
            columnData.push({
                items: nextColumnScope,
                selectedItem: null,
                trailingSelection: false,
                onSelect: this.onSelect(selectedItems.length)
            });
        }
        return { columnData };
    });

    onSelect = columnIndex => (event, name) => {
        // the lowest child component accepting the click/selection event should consume it
        event.stopPropagation();
        const { selectedItems } = this.state;
        if (selectedItems.length === (columnIndex + 1) && selectedItems[columnIndex] === name) {
            // selection has not changed, no need for any action
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
        // update state to trigger rerendering of the whole component
        this.setState({
            selectedItems: newSelection
        });
    };

    renderColumn(columnData, index) {
        const { renderItemContent } = this.props;
        return (
            <InspectorColumn
                key={index}
                renderItemContent={renderItemContent}
                {...columnData}
            />
        );
    }

    render() {
        const { schemas } = this.props;
        const { selectedItems } = this.state;
        const { columnData } = this.getRenderDataForSelection(schemas, selectedItems);
        return (
            <div className="jsonschema-inspector jsonschema-inspector-container">
                <div className="jsonschema-inspector-colview">
                    {columnData.map(this.renderColumn)}
                </div>
            </div>
        );
    }
}

Inspector.propTypes = {
    schemas: PropTypes.objectOf(JsonSchemaPropType).isRequired, // allow multiple independent root schemas to inspect
    defaultSelectedItems: PropTypes.arrayOf(PropTypes.string), // default selection identified by names of object properties
    renderItemContent: PropTypes.func // func(string: name, JsonSchema: schema, boolean: selected)
};

Inspector.defaultProps = {
    defaultSelectedItems: []
}

export default Inspector;
