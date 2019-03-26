import JsonSchemaAnyOfGroup from "../../src/model/JsonSchemaAnyOfGroup";

describe("getDefaultGroupTitle()", () => {
    it("always returns 'any of'", () => {
        expect(JsonSchemaAnyOfGroup.getDefaultGroupTitle()).toBe("any of");
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
            ${"missing parserConfig.anyOf"}      | ${[{}]}
            ${"missing parserConfig.anyOf.type"} | ${[{ anyOf: {} }]}
        `("throws error when $testType", ({ parameters }) => {
            expect(() => new JsonSchemaAnyOfGroup(...parameters)).toThrow();
        });
        it("throws no error when providing JsonSchema constructor and parserConfig.anyOf.type", () => {
            expect(new JsonSchemaAnyOfGroup({ anyOf: { type: "likeAllOf" } })).toBeInstanceOf(JsonSchemaAnyOfGroup);
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
            ${"missing parserConfig.anyOf"}      | ${[{}]}
            ${"missing parserConfig.anyOf.type"} | ${[{ anyOf: {} }]}
        `("throws no error when $testType", ({ parameters }) => {
            expect(new JsonSchemaAnyOfGroup(...parameters)).toBeInstanceOf(JsonSchemaAnyOfGroup);
        });
    });
});
