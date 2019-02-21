import PropTypes from "prop-types";
import React, { PureComponent } from "react";
import classNames from "classnames";

import JsonSchemaPropType from "./JsonSchemaPropType";
import { getPropertyParentFieldValue, isNonEmptyObject } from "./utils";

class InspectorItem extends PureComponent {
    static renderDefaultContent({ name }) {
        return (
            <div className="jsonschema-inspector-item-content">
                <span className="jsonschema-inspector-item-name">{name}</span>
                <span className="jsonschema-inspector-item-icon" />
            </div>
        );
    }

    componentDidUpdate() {
        if (this.buttonRef) {
            this.buttonRef.focus();
        }
    }

    render() {
        const {
            name, schema, selected, autoFocus, refTargets, onSelect, renderContent
        } = this.props;
        const hasNestedItems = isNonEmptyObject(getPropertyParentFieldValue(schema, "properties", refTargets));
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
        }
        const renderParameters = {
            name,
            hasNestedItems,
            selected,
            focused: autoFocus,
            schema,
            refTargets
        };
        return (
            <button type="button" {...buttonAttributes}>
                {(renderContent || InspectorItem.renderDefaultContent)(renderParameters)}
            </button>
        );
    }
}

InspectorItem.propTypes = {
    name: PropTypes.string.isRequired,
    schema: PropTypes.oneOfType([PropTypes.bool, JsonSchemaPropType]).isRequired,
    selected: PropTypes.bool,
    autoFocus: PropTypes.bool,
    refTargets: PropTypes.objectOf(JsonSchemaPropType).isRequired,
    onSelect: PropTypes.func.isRequired, // func(SyntheticEvent: event)
    renderContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema, refTargets })
};
InspectorItem.defaultProps = {
    selected: false,
    autoFocus: false,
    renderContent: null
};

export default InspectorItem;
