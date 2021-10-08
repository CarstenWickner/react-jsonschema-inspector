import * as React from "react";
import classNames from "classnames";

import { createBreadcrumbBuilder } from "./breadcrumbsUtils";
import { InspectorProps, RenderColumn, RenderOptionsColumn } from "./InspectorTypes";
import { isDefined } from "../model/utils";

export const InspectorBreadcrumbs: React.FunctionComponent<{
    columnData: Array<RenderColumn>;
    breadcrumbsOptions: InspectorProps["breadcrumbs"] & {};
}> = ({ columnData, breadcrumbsOptions }): React.ReactElement => {
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
                            (!(columnData[columnData.length - 1] as RenderOptionsColumn).options || !columnData[columnData.length - 1].selectedItem));
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
                            <span>{breadcrumbText}</span>
                        </span>
                    );
                })}
            </div>
            {renderTrailingContent &&
                renderTrailingContent({
                    breadcrumbTexts: columnData.map(buildBreadcrumb).filter(isDefined) as string[],
                    columnData
                })}
        </>
    );
};
