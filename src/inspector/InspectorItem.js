import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import classNames from 'classnames';

import JsonSchemaPropType from './JsonSchemaPropType';
import { hasNestedProperties } from './utils';

class InspectorItem extends PureComponent {

    renderDefaultItemContent(name) {
        return (
            <div className="jsonschema-inspector-item-content">
                <span className="jsonschema-inspector-item-name">{name}</span>
                <span className="jsonschema-inspector-item-icon"/>
            </div>
        );
    }

    render() {
        const { name, schema, selected, refTargets, onSelect, renderContent } = this.props;
        const itemClassName = classNames({
            'jsonschema-inspector-item': true,
            'has-nested-items': hasNestedProperties(schema, refTargets),
            selected
        });
        return (
            <button className={itemClassName} onClick={onSelect}>
                {(renderContent ? renderContent : this.renderDefaultItemContent)(name, schema, selected)}
            </button>
        );
    }
}

InspectorItem.propTypes = {
    name: PropTypes.string.isRequired,
    schema: PropTypes.oneOfType([PropTypes.bool, JsonSchemaPropType]).isRequired,
    selected: PropTypes.bool.isRequired,
    refTargets: PropTypes.objectOf(JsonSchemaPropType),
    onSelect: PropTypes.func.isRequired, // func(SyntheticEvent: event)
    renderContent: PropTypes.func // func(string: name, JsonSchema: schema, boolean: selected)
};

InspectorItem.defaultProps = {
    selected: false
};

export default InspectorItem;
