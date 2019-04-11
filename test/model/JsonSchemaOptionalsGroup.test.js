import JsonSchemaOptionalsGroup from "../../src/model/JsonSchemaOptionalsGroup";

describe("constructor", () => {
    class MockJsonSchemaOptionalsGroup extends JsonSchemaOptionalsGroup {
        static getDefaultGroupTitle() {
            return "mocked";
        }
    }
    describe("in 'development' mode", () => {
        let mode;
        beforeAll(() => {
            mode = process.env.NODE_ENV;
            process.env.NODE_ENV = "development";
        });
        afterAll(() => {
            process.env.NODE_ENV = mode;
        });

        it.each`
            testType                              | GroupClass                      | parameters
            ${"instantiated directly"}            | ${JsonSchemaOptionalsGroup}     | ${[{ type: "likeAllOf" }]}
            ${"providing no settings parameters"} | ${MockJsonSchemaOptionalsGroup} | ${[]}
            ${"providing no settings.type field"} | ${MockJsonSchemaOptionalsGroup} | ${[{}]}
        `("throws error when $testType", ({ GroupClass, parameters }) => {
            expect(() => new GroupClass(...parameters)).toThrow();
        });
        it("throws no error when providing JsonSchema constructor and settings.type", () => {
            expect(new MockJsonSchemaOptionalsGroup({ type: "likeAllOf" }))
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

        it.each`
            testType                              | GroupClass                      | parameters
            ${"instantiated directly"}            | ${JsonSchemaOptionalsGroup}     | ${[{ type: "likeAllOf" }]}
            ${"providing no settings parameter"}  | ${MockJsonSchemaOptionalsGroup} | ${[]}
            ${"providing no settings.type field"} | ${MockJsonSchemaOptionalsGroup} | ${[{}]}
        `("throws no error when $testType", ({ GroupClass, parameters }) => {
            expect(new GroupClass(...parameters)).toBeInstanceOf(GroupClass);
        });
    });
});

class MockJsonSchemaOptionalsGroup extends JsonSchemaOptionalsGroup {
    static getDefaultGroupTitle() {
        return "mocked";
    }
    constructor(settings = { type: "likeAllOf" }) {
        super(settings);
    }
}

describe("considerSchemasAsSeparateOptions()", () => {
    it("returns true if type is 'asAdditionalColumn'", () => {
        const group = new MockJsonSchemaOptionalsGroup({ type: "asAdditionalColumn" });
        expect(group.considerSchemasAsSeparateOptions()).toBe(true);
    });
    it("returns false if type is not 'asAdditionalColumn'", () => {
        const group = new MockJsonSchemaOptionalsGroup({ type: "likeAllOf" });
        expect(group.considerSchemasAsSeparateOptions()).toBe(false);
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
            groupTitle: "custom title",
            type: "asAdditionalColumn"
        });
        expect(group.createOptionsRepresentation(twoOptions)).toEqual({
            groupTitle: "custom title",
            options: twoOptions
        });
    });
});
