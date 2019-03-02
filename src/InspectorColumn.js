import PropTypes from "prop-types";
import React from "react";
import classNames from "classnames";

import JsonSchema from "./JsonSchema";
import InspectorItem from "./InspectorItem";

const InspectorColumn = ({
    items, selectedItem, trailingSelection, onSelect, renderItemContent
}) => (
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
        {Object.keys(items).sort().map((name) => {
            const selected = name === selectedItem;
            return (
                <InspectorItem
                    key={name}
                    name={name}
                    schema={items[name]}
                    selected={selected}
                    onSelect={event => onSelect(event, name)}
                    renderContent={renderItemContent}
                    autoFocus={selected && trailingSelection}
                />
            );
        })}
    </div>
);

InspectorColumn.propTypes = {
    items: PropTypes.objectOf(PropTypes.instanceOf(JsonSchema)).isRequired,
    selectedItem: ({ items, selectedItem }) => {
        if (selectedItem !== undefined && selectedItem !== null) {
            if (typeof selectedItem !== "string") {
                return new Error("`selectedItem` is not a `string`");
            }
            if (!items[selectedItem]) {
                return new Error("`selectedItem` is not part of `items`");
            }
        }
        // assume all ok
        return null;
    },
    trailingSelection: ({ selectedItem, trailingSelection }) => {
        if (trailingSelection && !selectedItem) {
            return new Error("`trailingSelection` is true while there is no `selectedItem`");
        }
        return null;
    },
    onSelect: PropTypes.func.isRequired, // func(SyntheticEvent: event, string: name)
    renderItemContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
};

InspectorColumn.defaultProps = {
    selectedItem: null,
    trailingSelection: false,
    renderItemContent: null
};

export default InspectorColumn;
