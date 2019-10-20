import * as PropTypes from "prop-types";
import * as React from "react";

import { isDefined } from "../model/utils";

export class InspectorDetailsForm extends React.Component<{
    fields: Array<{
        labelText: string,
        rowValue?: any
    }>
}> {
    render() {
        const { fields } = this.props;
        return (
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
    }

    static propTypes = {
        fields: PropTypes.arrayOf(
            PropTypes.shape({
                labelText: PropTypes.string.isRequired,
                rowValue: PropTypes.any
            })
        ).isRequired
    };
}
