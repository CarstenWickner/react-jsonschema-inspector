import PropTypes from "prop-types";
import React from "react";
import classNames from "classnames";

import JsonSchema from "./JsonSchema";
import { isDefined } from "./utils";

const InspectorBreadcrumbs = ({
    columnData, prefix, separator, arrayItemAccessor, preventNavigation
}) => (
    <div className="jsonschema-inspector-breadcrumbs">
        <span className="jsonschema-inspector-breadcrumbs-icon" />
        {columnData.map(({
            items, selectedItem, trailingSelection, onSelect
        }, index) => {
            if (!selectedItem) {
                // no selection: nothing to show in the breadcrumbs
                return null;
            }
            // if this is not the last selection, we need to add a (dummy) array item selector for each nested array
            let suffix = "";
            if (!trailingSelection) {
                let itemSchema = items[selectedItem].getTypeOfArrayItems();
                while (isDefined(itemSchema)) {
                    suffix += arrayItemAccessor;
                    itemSchema = itemSchema.getTypeOfArrayItems();
                }
            }
            const className = classNames({
                "jsonschema-inspector-breadcrumbs-item": true,
                "has-nested-items": index < (columnData.length - 1)
            });
            return (
                <span
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    className={className}
                    onDoubleClick={preventNavigation ? undefined : event => onSelect(event, selectedItem)}
                >
                    {(index === 0 ? prefix : separator) + selectedItem + suffix}
                </span>
            );
        })}
    </div>
);

InspectorBreadcrumbs.propTypes = {
    columnData: PropTypes.arrayOf(PropTypes.shape({
        items: PropTypes.objectOf(PropTypes.instanceOf(JsonSchema)).isRequired,
        selectedItem: PropTypes.string,
        trailingSelection: PropTypes.bool,
        onSelect: PropTypes.func.isRequired
    })).isRequired,
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
