import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import classNames from 'classnames';

import JsonSchemaPropType from './JsonSchemaPropType';
import InspectorItem from './InspectorItem';

class InspectorColumn extends PureComponent {
    renderItem(name) {
        const { items, selectedItem, onSelect, renderItemContent } = this.props;
        const item = items[name];
        return (
            <InspectorItem
                key={name}
                name={name}
                schema={item}
                selected={name === selectedItem}
                onSelect={event => onSelect(event, name)}
                renderContent={renderItemContent}
            />
        );
    }

    render() {
        const { items, selectedItem, trailingSelection, onSelect } = this.props;
        const columnClassName = classNames({
            'jsonschema-inspector-column': true,
            'with-selection': selectedItem,
            'trailing-selection': trailingSelection
        });
        return (
            <div className={columnClassName} onClick={onSelect}>
                {Object.keys(items).sort().map(this.renderItem.bind(this))}
            </div>
        );
    }
}

InspectorColumn.propTypes = {
    items: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.bool, JsonSchemaPropType])).isRequired,
    selectedItem: PropTypes.string,
    trailingSelection: PropTypes.bool,
    onSelect: PropTypes.func.isRequired, // func(SyntheticEvent: event, string: name)
    renderItemContent: PropTypes.func // func(string: name, JsonSchema: schema, boolean: selected)
};

export default InspectorColumn;
