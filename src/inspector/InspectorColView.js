import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import InspectorColumn from './InspectorColumn';
import JsonSchemaPropType from './JsonSchemaPropType';

class InspectorColView extends PureComponent {
    render() {
        const { columnData, renderItemContent } = this.props;
        return (
            <div className="jsonschema-inspector-colview">
                {columnData.map((singleColumnData, index) => (
                    <InspectorColumn
                        key={index}
                        renderItemContent={renderItemContent}
                        {...singleColumnData}
                    />
                ))}
            </div>
        );
    }
}

InspectorColView.propTypes = {
    columnData: PropTypes.arrayOf(PropTypes.shape({
        items: PropTypes.objectOf(JsonSchemaPropType).isRequired,
        selectedItem: PropTypes.string,
        trailingSelection: PropTypes.bool,
        refTargets: PropTypes.objectOf(JsonSchemaPropType)
    })),
    renderItemContent: PropTypes.func // func(string: name, JsonSchema: schema, boolean: selected)
}

export default InspectorColView;