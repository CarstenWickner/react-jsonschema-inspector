import * as React from "react";
import { shallow } from "enzyme";

import { InspectorSearchField } from "../../src/component/InspectorSearchField";
import { isDefined } from "../../src/model/utils";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const component = shallow(<InspectorSearchField searchFilter="" onSearchFilterChange={(): void => {}} />);
        expect(component).toMatchSnapshot();
    });
    it("with searchFilter set", () => {
        const component = shallow(<InspectorSearchField searchFilter="test-value" onSearchFilterChange={(): void => {}} />);
        expect(component.find("input").prop("value")).toEqual("test-value");
    });
});
describe("calls onSearchFilterChange", () => {
    let mockEvent: React.ChangeEvent<{ value: string }>;
    let onSearchFilterChange: () => void;
    beforeEach(() => {
        mockEvent = {
            stopPropagation: (): void => {},
            target: { value: "new-filter-value" } as EventTarget & { value: string }
        } as React.ChangeEvent<{ value: string }>;
        onSearchFilterChange = jest.fn(() => {});
    });

    it("on input's onChange", () => {
        const component = shallow(<InspectorSearchField searchFilter="old-filter-value" onSearchFilterChange={onSearchFilterChange} />);
        const onChange = component.find("input").prop("onChange");
        expect(onChange).toBeDefined();
        if (isDefined(onChange)) {
            onChange(mockEvent);
        }
        expect(onSearchFilterChange).toHaveBeenCalledWith("new-filter-value");
    });
});
