import PropTypes from "prop-types";
import React, { PureComponent } from "react";
import classNames from "classnames";

import JsonSchemaPropType from "./JsonSchemaPropType";
import { getTypeOfArrayItems, isDefined } from "./utils";

class InspectorBreadcrumbs extends PureComponent {
    renderSingleColumnSelection({
        items, selectedItem, trailingSelection, onSelect
    }, index, columnData) {
        if (!selectedItem) {
            // no selection: nothing to show in the breadcrumbs
            return null;
        }
        const {
            prefix, separator, arrayItemAccessor, refTargets, preventNavigation
        } = this.props;
        // if this is not the last selection, we need to add a (dummy) array item selector for each nested array
        let suffix = "";
        if (!trailingSelection) {
            let itemSchema = getTypeOfArrayItems(items[selectedItem], refTargets);
            while (isDefined(itemSchema)) {
                suffix += arrayItemAccessor;
                itemSchema = getTypeOfArrayItems(itemSchema, refTargets);
            }
        }
        const className = classNames({
            "jsonschema-inspector-breadcrumbs-item": true,
            "has-nested-items": index < (columnData.length - 1)
        });
        return (
            <span
                key={index}
                className={className}
                onDoubleClick={preventNavigation ? undefined : event => onSelect(event, selectedItem)}
            >
                {(index === 0 ? prefix : separator) + selectedItem + suffix}
            </span>
        );
    }

    render() {
        const { columnData } = this.props;
        return (
            <div className="jsonschema-inspector-breadcrumbs">
                <span className="jsonschema-inspector-breadcrumbs-icon" />
                {columnData.map(this.renderSingleColumnSelection.bind(this))}
            </div>
        );
    }
}

InspectorBreadcrumbs.propTypes = {
    columnData: PropTypes.arrayOf(PropTypes.shape({
        items: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.bool, JsonSchemaPropType])).isRequired,
        selectedItem: PropTypes.string,
        trailingSelection: PropTypes.bool,
        onSelect: PropTypes.func.isRequired
    })).isRequired,
    refTargets: PropTypes.objectOf(JsonSchemaPropType).isRequired,
    prefix: PropTypes.string,
    separator: PropTypes.string,
    arrayItemAccessor: PropTypes.string,
    preventNavigation: PropTypes.bool
};

InspectorBreadcrumbs.defaultProps = {
    prefix: "",
    separator: ".",
    arrayItemAccessor: "[0]",
    preventNavigation: false
};

export default InspectorBreadcrumbs;
