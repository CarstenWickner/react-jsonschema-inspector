import PropTypes from "prop-types";
import React, { Component } from "react";

import InspectorColumn from "./InspectorColumn";
import InspectorOptionsColumn from "./InspectorOptionsColumn";
import { getColumnDataPropTypeShape } from "./renderDataUtils";

class InspectorColView extends Component {
    componentDidUpdate(prevProps) {
        const previousColumnCount = prevProps.columnData.length + (prevProps.appendEmptyColumn ? 1 : 0);
        const { columnData, appendEmptyColumn } = this.props;
        const currentColumnCount = columnData.length + (appendEmptyColumn ? 1 : 0);
        if (previousColumnCount < currentColumnCount) {
            // auto-scroll to the far right if an additional column was added
            this.colViewContainerRef.scrollLeft = this.colViewContainerRef.scrollWidth;
        }
    }

    render() {
        const {
            columnData, appendEmptyColumn, renderItemContent
        } = this.props;
        return (
            <div
                className="jsonschema-inspector-colview"
                ref={(ref) => { this.colViewContainerRef = ref; }}
                tabIndex={-1}
            >
                {columnData.map((singleColumnData, index) => {
                    const {
                        items, options, contextGroup, selectedItem, trailingSelection, filteredItems, onSelect
                    } = singleColumnData;
                    if (items) {
                        return (
                            <InspectorColumn
                                // eslint-disable-next-line react/no-array-index-key
                                key={index}
                                items={items}
                                selectedItem={selectedItem}
                                trailingSelection={trailingSelection}
                                filteredItems={filteredItems}
                                onSelect={onSelect}
                                renderItemContent={renderItemContent}
                            />
                        );
                    }
                    return (
                        <InspectorOptionsColumn
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                            options={options}
                            contextGroup={contextGroup}
                            selectedItem={selectedItem}
                            trailingSelection={trailingSelection}
                            filteredItems={filteredItems}
                            onSelect={onSelect}
                            renderItemContent={renderItemContent}
                        />
                    );
                })}
                {appendEmptyColumn
                    && <div className="jsonschema-inspector-column-placeholder" />}
            </div>
        );
    }
}

InspectorColView.propTypes = {
    columnData: PropTypes.arrayOf(PropTypes.shape(getColumnDataPropTypeShape(true))).isRequired,
    appendEmptyColumn: PropTypes.bool,
    renderItemContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
};

InspectorColView.defaultProps = {
    appendEmptyColumn: false,
    renderItemContent: null
};

export default InspectorColView;
