import PropTypes from "prop-types";
import React from "react";
import classNames from "classnames";

import InspectorItem from "./InspectorItem";
import { getColumnDataPropTypeShape } from "./renderDataUtils";

const InspectorColumn = (props) => {
    const {
        items, selectedItem, filteredItems, trailingSelection, onSelect, renderItemContent
    } = props;
    return (
        <div
            className={classNames({
                "jsonschema-inspector-column": true,
                "with-selection": selectedItem,
                "trailing-selection": trailingSelection
            })}
            onClick={onSelect}
            role="presentation"
            tabIndex={-1}
        >
            {Object.keys(items).sort().map(name => (
                <InspectorItem
                    key={name}
                    name={name}
                    schemaGroup={items[name]}
                    selected={name === selectedItem}
                    matchesFilter={filteredItems ? filteredItems.includes(name) : undefined}
                    onSelect={event => onSelect(event, name)}
                    renderContent={renderItemContent}
                />
            ))}
        </div>
    );
};

const columnDataPropTypeShape = getColumnDataPropTypeShape(false);
InspectorColumn.propTypes = {
    items: columnDataPropTypeShape.items.isRequired,
    selectedItem: PropTypes.string,
    filteredItems: PropTypes.arrayOf(PropTypes.string),
    trailingSelection: columnDataPropTypeShape.trailingSelection,
    onSelect: columnDataPropTypeShape.onSelect.isRequired,
    renderItemContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
};
InspectorColumn.defaultProps = {
    selectedItem: null,
    filteredItems: null,
    trailingSelection: false,
    renderItemContent: null
};

export default InspectorColumn;
