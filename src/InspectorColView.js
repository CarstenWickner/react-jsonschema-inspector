import PropTypes from "prop-types";
import React, { PureComponent } from "react";

import InspectorColumn from "./InspectorColumn";
import JsonSchema from "./JsonSchema";

class InspectorColView extends PureComponent {
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
                        items, selectedItem, trailingSelection, onSelect
                    } = singleColumnData;
                    return (
                        <InspectorColumn
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                            renderItemContent={renderItemContent}
                            items={items}
                            selectedItem={selectedItem}
                            trailingSelection={trailingSelection}
                            onSelect={onSelect}
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
    columnData: PropTypes.arrayOf(PropTypes.shape({
        items: PropTypes.objectOf(PropTypes.instanceOf(JsonSchema)).isRequired,
        selectedItem: PropTypes.string,
        trailingSelection: PropTypes.bool,
        onSelect: PropTypes.func.isRequired // func(SyntheticEvent: event, string: name)
    })).isRequired,
    appendEmptyColumn: PropTypes.bool,
    renderItemContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
};

InspectorColView.defaultProps = {
    appendEmptyColumn: false,
    renderItemContent: null
};

export default InspectorColView;
