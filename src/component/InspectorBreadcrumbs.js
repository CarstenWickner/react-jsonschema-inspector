import PropTypes from "prop-types";
import React from "react";
import classNames from "classnames";

import JsonSchema from "../model/JsonSchema";
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
                    "has-nested-items": index < (columnData.length - 1)
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
    columnData: PropTypes.arrayOf(PropTypes.shape({
        items: PropTypes.objectOf(PropTypes.instanceOf(JsonSchema)).isRequired,
        selectedItem: PropTypes.string,
        trailingSelection: PropTypes.bool,
        onSelect: PropTypes.func.isRequired
    })).isRequired,
    breadcrumbsOptions: PropTypes.shape({
        prefix: PropTypes.string,
        separator: PropTypes.string,
        arrayItemAccessor: PropTypes.string,
        mutateName: PropTypes.func,
        preventNavigation: PropTypes.bool
    }).isRequired
};

export default InspectorBreadcrumbs;