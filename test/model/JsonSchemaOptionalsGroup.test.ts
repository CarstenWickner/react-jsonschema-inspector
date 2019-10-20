import { JsonSchemaOptionalsGroup } from "../../src/model/JsonSchemaOptionalsGroup";

describe("considerSchemasAsSeparateOptions()", () => {
    it("returns true", () => {
        const group = new JsonSchemaOptionalsGroup({});
        expect(group.considerSchemasAsSeparateOptions()).toBe(true);
    });
});
describe("createOptionsRepresentation()", () => {
    const twoOptions = [{}, {}];
    const wrapperWithTitle = {
        groupTitle: "existing title",
        options: [{}, {}, {}]
    };
    it.each`
        input                        | outcome                  | containedOptions      | representation
        ${"empty options array"}     | ${"empty object"}        | ${[]}                 | ${{}}
        ${"array with length === 1"} | ${"single option entry"} | ${[wrapperWithTitle]} | ${wrapperWithTitle}
        ${"array with length === 2"} | ${"wrapper object"}      | ${twoOptions}         | ${{ options: twoOptions }}
    `("returns $outcome for $input", ({ containedOptions, representation }) => {
        const group = new JsonSchemaOptionalsGroup({});
        expect(group.createOptionsRepresentation(containedOptions)).toEqual(representation);
    });
    it("returns wrapper object for array with length === 2 (with title from settings)", () => {
        const group = new JsonSchemaOptionalsGroup({
            groupTitle: "custom title"
        });
        expect(group.createOptionsRepresentation(twoOptions)).toEqual({
            groupTitle: "custom title",
            options: twoOptions
        });
    });
});
