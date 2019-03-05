import PropTypes from "prop-types";
import React from "react";

const InspectorSearchField = (props) => {
    const { searchFilter, onSearchFilterChange } = props;
    return (
        <div className="jsonschema-inspector-search">
            <input
                type="search"
                className="jsonschame-inspector-search-input"
                value={searchFilter}
                onChange={(event) => {
                    event.stopPropagation();
                    onSearchFilterChange(event.target.value);
                }}
            />
        </div>
    );
};

InspectorSearchField.propTypes = {
    searchFilter: PropTypes.string,
    onSearchFilterChange: PropTypes.func.isRequired
};
InspectorSearchField.defaultProps = {
    searchFilter: null
};

export default InspectorSearchField;
