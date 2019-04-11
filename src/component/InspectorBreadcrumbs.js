import PropTypes from "prop-types";
import React from "react";
import classNames from "classnames";

import { getColumnDataPropTypeShape } from "./renderDataUtils";

import createBreadcrumbBuilder from "../model/breadcrumbsUtils";

const InspectorBreadcrumbs = ({ columnData, breadcrumbsOptions }) => {
    const buildBreadcrumb = createBreadcrumbBuilder(breadcrumbsOptions);
    const { preventNavigation } = breadcrumbsOptions;
    return (
        <div className="jsonschema-inspector-breadcrumbs">
            <span className="jsonschema-inspector-breadcrumbs-icon" />
            {columnData.map((column, index) => {
                const breadcrumbText = buildBreadcrumb(column, index);
                if (!breadcrumbText) {
                    // omit empty breadcrumb
                    return null;
                }
                const className = classNames({
                    "jsonschema-inspector-breadcrumbs-item": true,
                    "has-nested-items": index < (columnData.length - 2)
                        || (index === (columnData.length - 2)
                            && (!columnData[columnData.length - 1].options || !columnData[columnData.length - 1].selectedItem))
                });
                const { selectedItem, onSelect } = column;
                return (
                    <span
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        className={className}
                        onDoubleClick={preventNavigation ? undefined : event => onSelect(event, selectedItem)}
                    >
                        {breadcrumbText}
                    </span>
                );
            })}
        </div>
    );
};

InspectorBreadcrumbs.propTypes = {
    columnData: PropTypes.arrayOf(PropTypes.shape(getColumnDataPropTypeShape(true))).isRequired,
    breadcrumbsOptions: PropTypes.shape({
        prefix: PropTypes.string,
        separator: PropTypes.string,
        skipSeparator: PropTypes.func,
        mutateName: PropTypes.func,
        preventNavigation: PropTypes.bool
    }).isRequired
};

export default InspectorBreadcrumbs;
