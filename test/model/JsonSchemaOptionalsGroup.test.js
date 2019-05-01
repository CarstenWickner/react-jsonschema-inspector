import JsonSchemaOptionalsGroup from "../../src/model/JsonSchemaOptionalsGroup";

class MockJsonSchemaOptionalsGroup extends JsonSchemaOptionalsGroup {
    static getDefaultGroupTitle() {
        return "mocked";
    }
}
describe("constructor", () => {
    describe("in 'development' mode", () => {
        let mode;
        beforeAll(() => {
            mode = process.env.NODE_ENV;
            process.env.NODE_ENV = "development";
        });
        afterAll(() => {
            process.env.NODE_ENV = mode;
        });

        it("throws error when instantiated directly", () => {
            expect(() => new JsonSchemaOptionalsGroup({})).toThrow();
        });
        it("throws no error when getDefaultGroupTitle() is implemented", () => {
            expect(new MockJsonSchemaOptionalsGroup({}))
                .toBeInstanceOf(MockJsonSchemaOptionalsGroup);
        });
    });
    describe("in 'production' mode", () => {
        let mode;
        beforeAll(() => {
            mode = process.env.NODE_ENV;
            process.env.NODE_ENV = "production";
        });
        afterAll(() => {
            process.env.NODE_ENV = mode;
        });

        it("throws no error when instantiated directly", () => {
            expect(() => new JsonSchemaOptionalsGroup({})).not.toThrow();
        });
    });
});

describe("considerSchemasAsSeparateOptions()", () => {
    it("returns true if type is 'asAdditionalColumn'", () => {
        const group = new MockJsonSchemaOptionalsGroup({});
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
        ${"array with length === 2"} | ${"wrapper object"}      | ${twoOptions}         | ${{ groupTitle: "mocked", options: twoOptions }}
    `("returns $outcome for $input", ({ containedOptions, representation }) => {
        const group = new MockJsonSchemaOptionalsGroup();
        expect(group.createOptionsRepresentation(containedOptions)).toEqual(representation);
    });
    it("returns wrapper object for array with length === 2 (with title from settings)", () => {
        const group = new MockJsonSchemaOptionalsGroup({
            groupTitle: "custom title"
        });
        expect(group.createOptionsRepresentation(twoOptions)).toEqual({
            groupTitle: "custom title",
            options: twoOptions
        });
    });
});
