/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";

import { isDefined } from "../model/utils";

export const InspectorDetailsForm: React.FunctionComponent<{ fields: Array<{ labelText: string; rowValue?: any }> }> = ({
    fields
}): React.ReactElement => (
    <form className="jsonschema-inspector-details-form">
        {fields.map(({ labelText, rowValue }) => {
            if (!isDefined(rowValue)) {
                return null;
            }
            return (
                <div className="jsonschema-inspector-details-form-row" key={labelText}>
                    <span className="jsonschema-inspector-details-form-label">{`${labelText}:`}</span>
                    <span className="jsonschema-inspector-details-form-value">
                        {Array.isArray(rowValue) ? rowValue.join(", ") : rowValue.toString()}
                    </span>
                </div>
            );
        })}
    </form>
);
