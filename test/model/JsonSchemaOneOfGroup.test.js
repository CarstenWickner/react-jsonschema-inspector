import JsonSchemaOneOfGroup from "../../src/model/JsonSchemaOneOfGroup";

describe("getDefaultGroupTitle()", () => {
    it("always returns 'one of'", () => {
        expect(JsonSchemaOneOfGroup.getDefaultGroupTitle()).toBe("one of");
    });
});

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

        it.each`
            testType                              | parameters
            ${"missing parserConfig"}            | ${[]}
            ${"missing parserConfig.oneOf"}      | ${[{}]}
            ${"missing parserConfig.oneOf.type"} | ${[{ oneOf: {} }]}
        `("throws error when $testType", ({ parameters }) => {
            expect(() => new JsonSchemaOneOfGroup(...parameters)).toThrow();
        });
        it("throws no error when providing JsonSchema constructor and parserConfig.oneOf.type", () => {
            expect(new JsonSchemaOneOfGroup({ oneOf: { type: "likeAllOf" } })).toBeInstanceOf(JsonSchemaOneOfGroup);
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
            testType                             | parameters
            ${"missing parserConfig"}            | ${[]}
            ${"missing parserConfig.oneOf"}      | ${[{}]}
            ${"missing parserConfig.oneOf.type"} | ${[{ oneOf: {} }]}
        `("throws no error when $testType", ({ parameters }) => {
            expect(new JsonSchemaOneOfGroup(...parameters)).toBeInstanceOf(JsonSchemaOneOfGroup);
        });
    });
});
