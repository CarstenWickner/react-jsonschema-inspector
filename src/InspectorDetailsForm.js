import PropTypes from "prop-types";
import React from "react";

import { isDefined } from "./utils";

const InspectorDetailsForm = ({ fields }) => (
    <form className="jsonschema-inspector-details-form">
        {fields.map(({ labelText, rowValue }) => {
            if (!isDefined(rowValue)) {
                return null;
            }
            return (
                <div className="jsonschema-inspector-details-form-row" key={labelText}>
                    <span className="jsonschema-inspector-details-form-label">{`${labelText}:`}</span>
                    <span className="jsonschema-inspector-details-form-value">{rowValue.toString()}</span>
                </div>
            );
        })}
    </form>
);

InspectorDetailsForm.propTypes = {
    fields: PropTypes.arrayOf(
        PropTypes.shape({
            labelText: PropTypes.string.isRequired,
            rowValue: PropTypes.any
        }).isRequired
    ).isRequired
};

export default InspectorDetailsForm;
