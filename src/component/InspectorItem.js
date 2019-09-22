import PropTypes from "prop-types";
import React from "react";
import classNames from "classnames";

import JsonSchemaGroup from "../model/JsonSchemaGroup";
import { hasSchemaGroupNestedItems } from "./renderDataUtils";
import { isDefined } from "../model/utils";

const InspectorItem = ({
    name, schemaGroup, optionIndexes, selected, matchesFilter, onSelect, renderContent
}) => {
    const hasNestedItems = hasSchemaGroupNestedItems(schemaGroup, optionIndexes);
    return (
        <button
            type="button"
            className={classNames({
                "jsonschema-inspector-item": true,
                "has-nested-items": hasNestedItems,
                selected,
                "matching-filter": matchesFilter,
                "not-matching-filter": isDefined(matchesFilter) && !matchesFilter
            })}
            onClick={onSelect}
            onFocus={onSelect}
        >
            {renderContent && renderContent({
                name,
                hasNestedItems,
                selected,
                schemaGroup,
                optionIndexes
            })}
            {!renderContent && (
                <div className="jsonschema-inspector-item-content">
                    <span className="jsonschema-inspector-item-name">{name}</span>
                    <span className="jsonschema-inspector-item-icon" />
                </div>
            )}
        </button>
    );
};

InspectorItem.propTypes = {
    name: PropTypes.string.isRequired,
    schemaGroup: PropTypes.instanceOf(JsonSchemaGroup).isRequired,
    optionIndexes: PropTypes.arrayOf(PropTypes.number),
    selected: PropTypes.bool,
    matchesFilter: PropTypes.bool,
    onSelect: PropTypes.func.isRequired, // func(SyntheticEvent: event)
    renderContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
};
InspectorItem.defaultProps = {
    optionIndexes: undefined,
    selected: false,
    matchesFilter: undefined,
    renderContent: null
};

export default InspectorItem;
