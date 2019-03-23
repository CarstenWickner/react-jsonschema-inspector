import JsonSchemaOneOfGroup from "../../src/model/JsonSchemaOneOfGroup";
import JsonSchema from "../../src/model/JsonSchema";

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
            ${"missing JsonSchema reference"}    | ${[undefined, { oneOf: { type: "likeAllOf" } }]}
            ${"missing parserConfig"}            | ${[JsonSchema]}
            ${"missing parserConfig.oneOf"}      | ${[JsonSchema, {}]}
            ${"missing parserConfig.oneOf.type"} | ${[JsonSchema, { oneOf: {} }]}
        `("throws error when $testType", ({ parameters }) => {
            try {
                const successfullyInitialisedGroup = new JsonSchemaOneOfGroup(...parameters);
                expect(successfullyInitialisedGroup).toBeUndefined();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
            }
        });
        it("throws no error when providing JsonSchema constructor and parserConfig.oneOf.type", () => {
            expect(new JsonSchemaOneOfGroup(JsonSchema, { oneOf: { type: "likeAllOf" } })).toBeInstanceOf(JsonSchemaOneOfGroup);
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
            ${"missing JsonSchema reference"}    | ${[undefined, { oneOf: { type: "likeAllOf" } }]}
            ${"missing parserConfig"}            | ${[JsonSchema]}
            ${"missing parserConfig.oneOf"}      | ${[JsonSchema, {}]}
            ${"missing parserConfig.oneOf.type"} | ${[JsonSchema, { oneOf: {} }]}
        `("throws no error when $testType", ({ parameters }) => {
            expect(new JsonSchemaOneOfGroup(...parameters)).toBeInstanceOf(JsonSchemaOneOfGroup);
        });
    });
});
