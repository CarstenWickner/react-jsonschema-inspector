import PropTypes from "prop-types";
import React, { Component } from "react";
import classNames from "classnames";

import JsonSchema from "./JsonSchema";
import { isNonEmptyObject } from "./utils";

class InspectorItem extends Component {
    componentDidUpdate() {
        if (this.buttonRef) {
            this.buttonRef.focus();
        }
    }

    render() {
        const {
            name, schema, selected, autoFocus, onSelect, renderContent
        } = this.props;
        const hasNestedItems = isNonEmptyObject(schema.getProperties());
        const buttonAttributes = {
            className: classNames({
                "jsonschema-inspector-item": true,
                "has-nested-items": hasNestedItems,
                selected
            }),
            onClick: onSelect,
            onFocus: onSelect
        };
        if (autoFocus) {
            buttonAttributes.ref = (ref) => {
                this.buttonRef = ref;
            };
        } else {
            // clear reference in case props indicated autoFocus before
            this.buttonRef = null;
        }
        return (
            <button type="button" {...buttonAttributes}>
                {renderContent && renderContent({
                    name,
                    hasNestedItems,
                    selected,
                    focused: autoFocus,
                    schema
                })}
                {!renderContent && (
                    <div className="jsonschema-inspector-item-content">
                        <span className="jsonschema-inspector-item-name">{name}</span>
                        <span className="jsonschema-inspector-item-icon" />
                    </div>
                )}
            </button>
        );
    }
}

InspectorItem.propTypes = {
    name: PropTypes.string.isRequired,
    schema: PropTypes.instanceOf(JsonSchema).isRequired,
    selected: PropTypes.bool,
    autoFocus: ({ selected, autoFocus }) => {
        if (autoFocus && !selected) {
            return new Error("`autoFocus` is true while it is not `selected`");
        }
        return null;
    },
    onSelect: PropTypes.func.isRequired, // func(SyntheticEvent: event)
    renderContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
};
InspectorItem.defaultProps = {
    selected: false,
    autoFocus: false,
    renderContent: null
};

export default InspectorItem;
