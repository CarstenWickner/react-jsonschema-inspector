import PropTypes from "prop-types";
import React from "react";
import classNames from "classnames";

import { getColumnDataPropTypeShape } from "./renderDataUtils";

import createBreadcrumbBuilder from "../model/breadcrumbsUtils";

const InspectorBreadcrumbs = ({ columnData, breadcrumbsOptions }) => {
    const buildBreadcrumb = createBreadcrumbBuilder(breadcrumbsOptions);
    const { preventNavigation, renderItem, renderTrailingContent } = breadcrumbsOptions;
    return (
        <>
            <div className="jsonschema-inspector-breadcrumbs">
                <span className="jsonschema-inspector-breadcrumbs-icon" />
                {columnData.map((column, index) => {
                    const breadcrumbText = buildBreadcrumb(column, index);
                    if (!breadcrumbText) {
                        // omit empty breadcrumb
                        return null;
                    }
                    const hasNestedItems = index < (columnData.length - 2)
                        || (index === (columnData.length - 2)
                            && (!columnData[columnData.length - 1].options || !columnData[columnData.length - 1].selectedItem));
                    if (renderItem) {
                        return renderItem(breadcrumbText, hasNestedItems, column, index);
                    }
                    const { selectedItem, onSelect } = column;
                    return (
                        <span
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                            className={classNames({
                                "jsonschema-inspector-breadcrumbs-item": true,
                                "has-nested-items": hasNestedItems
                            })}
                            onDoubleClick={preventNavigation ? undefined : event => onSelect(event, selectedItem)}
                        >
                            {breadcrumbText}
                        </span>
                    );
                })}
            </div>
            {renderTrailingContent && renderTrailingContent(columnData.map(buildBreadcrumb).filter(b => !!b), columnData)}
        </>
    );
};

InspectorBreadcrumbs.propTypes = {
    columnData: PropTypes.arrayOf(PropTypes.shape(getColumnDataPropTypeShape(true))).isRequired,
    breadcrumbsOptions: PropTypes.shape({
        prefix: PropTypes.string,
        separator: PropTypes.string,
        skipSeparator: PropTypes.func,
        mutateName: PropTypes.func,
        preventNavigation: PropTypes.bool,
        renderItem: PropTypes.func,
        renderTrailingContent: PropTypes.func
    }).isRequired
};

export default InspectorBreadcrumbs;
