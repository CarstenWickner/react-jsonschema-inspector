import * as React from "react";
import { shallow } from "enzyme";

import { InspectorDetailsForm } from "../../src/component/InspectorDetailsForm";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const component = shallow(
            <InspectorDetailsForm
                fields={[
                    {
                        labelText: "Field One",
                        rowValue: 1
                    },
                    {
                        labelText: "Field Two",
                        rowValue: ["mixed", "array", "text"]
                    }
                ]}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it("ignoring undefined/null rowValues", () => {
        const component = shallow(
            <InspectorDetailsForm
                fields={[
                    {
                        labelText: "Field One"
                    },
                    {
                        labelText: "Field Two",
                        rowValue: undefined
                    },
                    {
                        labelText: "Field Three",
                        rowValue: null
                    }
                ]}
            />
        );
        expect(component.find(".jsonschema-inspector-details-form-row")).toHaveLength(0);
    });
    it("including other falsy rowValues", () => {
        const component = shallow(
            <InspectorDetailsForm
                fields={[
                    {
                        labelText: "Field One",
                        rowValue: 0
                    },
                    {
                        labelText: "Field Two",
                        rowValue: false
                    },
                    {
                        labelText: "Field Three",
                        rowValue: ""
                    }
                ]}
            />
        );
        expect(component.find(".jsonschema-inspector-details-form-row")).toHaveLength(3);
    });
});
