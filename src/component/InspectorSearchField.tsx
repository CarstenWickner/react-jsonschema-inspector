import * as React from "react";

export class InspectorSearchField extends React.Component<{
    searchFilter: string;
    onSearchFilterChange: (newFilterValue: string) => void;
    placeholder?: string;
    renderSearchInput?: (params: {
        searchFilter: string;
        placeholder: string;
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    }) => React.ReactElement;
}> {
    static defaultRenderSearchInput = (params: {
        searchFilter: string;
        placeholder: string;
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    }): React.ReactElement => (
        <input
            type="search"
            className="jsonschema-inspector-search-input"
            value={params.searchFilter}
            placeholder={params.placeholder}
            onChange={params.onChange}
        />
    );

    onChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        event.stopPropagation();
        this.props.onSearchFilterChange(event.target.value);
    };

    render(): React.ReactElement {
        const { searchFilter, placeholder = "Search", renderSearchInput = InspectorSearchField.defaultRenderSearchInput } = this.props;
        return <div className="jsonschema-inspector-search">{renderSearchInput({ searchFilter, placeholder, onChange: this.onChange })}</div>;
    }
}
