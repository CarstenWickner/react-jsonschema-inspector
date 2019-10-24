import * as PropTypes from "prop-types";
import * as React from "react";
import classNames from "classnames";

import { ColumnDataPropType } from "./renderDataUtils";
import { createBreadcrumbBuilder } from "../model/breadcrumbsUtils";
import { BreadcrumbsOptions, RenderColumn, RenderOptionsColumn } from "../types/Inspector";

interface InspectorBreadcrumbsProps {
    columnData: Array<RenderColumn>;
    breadcrumbsOptions: BreadcrumbsOptions;
}

export class InspectorBreadcrumbs extends React.Component<InspectorBreadcrumbsProps> {
    render(): React.ReactNode {
        const { columnData, breadcrumbsOptions } = this.props;
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
                        const hasNestedItems =
                            index < columnData.length - 2 ||
                            (index === columnData.length - 2 &&
                                (!(columnData[columnData.length - 1] as RenderOptionsColumn).options ||
                                    !columnData[columnData.length - 1].selectedItem));
                        if (renderItem) {
                            return renderItem({
                                breadcrumbText,
                                hasNestedItems,
                                column,
                                index
                            });
                        }
                        const { selectedItem, onSelect } = column;
                        return (
                            <span
                                key={index}
                                className={classNames({
                                    "jsonschema-inspector-breadcrumbs-item": true,
                                    "has-nested-items": hasNestedItems
                                })}
                                onDoubleClick={preventNavigation ? undefined : (event): void => onSelect(event, selectedItem)}
                            >
                                {breadcrumbText}
                            </span>
                        );
                    })}
                </div>
                {renderTrailingContent &&
                    renderTrailingContent({
                        breadcrumbTexts: columnData.map(buildBreadcrumb).filter((b) => !!b),
                        columnData
                    })}
            </>
        );
    }

    static propTypes = {
        columnData: ColumnDataPropType.isRequired,
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
}
