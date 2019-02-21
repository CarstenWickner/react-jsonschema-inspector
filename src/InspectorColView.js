import PropTypes from "prop-types";
import React, { PureComponent } from "react";

import InspectorColumn from "./InspectorColumn";
import JsonSchemaPropType from "./JsonSchemaPropType";

class InspectorColView extends PureComponent {
    componentDidUpdate(prevProps) {
        const previousColumnCount = prevProps.columnData.length;
        // eslint-disable-next-line react/destructuring-assignment
        const currentColumnCount = this.props.columnData.length;
        if (previousColumnCount < currentColumnCount) {
            // auto-scroll to the far right if an additional column was added
            this.colViewContainerRef.scrollLeft = this.colViewContainerRef.scrollWidth;
        }
    }

    render() {
        const {
            columnData, refTargets, appendEmptyColumn, renderItemContent
        } = this.props;
        return (
            <div className="jsonschema-inspector-colview" ref={(ref) => { this.colViewContainerRef = ref; }}>
                {columnData.map((singleColumnData, index) => (
                    <InspectorColumn
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        refTargets={refTargets}
                        renderItemContent={renderItemContent}
                        {...singleColumnData}
                    />
                ))}
                {appendEmptyColumn
                    && <div className="jsonschema-inspector-column-placeholder" />}
            </div>
        );
    }
}

InspectorColView.propTypes = {
    columnData: PropTypes.arrayOf(PropTypes.shape({
        items: PropTypes.objectOf(JsonSchemaPropType).isRequired,
        selectedItem: PropTypes.string,
        trailingSelection: PropTypes.bool
    })).isRequired,
    refTargets: PropTypes.objectOf(JsonSchemaPropType).isRequired,
    appendEmptyColumn: PropTypes.bool,
    renderItemContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema, refTargets })
};

InspectorColView.defaultProps = {
    appendEmptyColumn: false,
    renderItemContent: null
};

export default InspectorColView;
