import JsonSchemaAnyOfGroup from "../../src/model/JsonSchemaAnyOfGroup";
import JsonSchema from "../../src/model/JsonSchema";

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
            ${"missing JsonSchema reference"}    | ${[undefined, { anyOf: { type: "likeAllOf" } }]}
            ${"missing parserConfig"}            | ${[JsonSchema]}
            ${"missing parserConfig.anyOf"}      | ${[JsonSchema, {}]}
            ${"missing parserConfig.anyOf.type"} | ${[JsonSchema, { anyOf: {} }]}
        `("throws error when $testType", ({ parameters }) => {
            try {
                const successfullyInitialisedGroup = new JsonSchemaAnyOfGroup(...parameters);
                expect(successfullyInitialisedGroup).toBeUndefined();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
            }
        });
        it("throws no error when providing JsonSchema constructor and parserConfig.anyOf.type", () => {
            expect(new JsonSchemaAnyOfGroup(JsonSchema, { anyOf: { type: "likeAllOf" } })).toBeInstanceOf(JsonSchemaAnyOfGroup);
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
            ${"missing JsonSchema reference"}    | ${[undefined, { anyOf: { type: "likeAllOf" } }]}
            ${"missing parserConfig"}            | ${[JsonSchema]}
            ${"missing parserConfig.anyOf"}      | ${[JsonSchema, {}]}
            ${"missing parserConfig.anyOf.type"} | ${[JsonSchema, { anyOf: {} }]}
        `("throws no error when $testType", ({ parameters }) => {
            expect(new JsonSchemaAnyOfGroup(...parameters)).toBeInstanceOf(JsonSchemaAnyOfGroup);
        });
    });
});
