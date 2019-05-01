import JsonSchemaAnyOfGroup from "../../src/model/JsonSchemaAnyOfGroup";

describe("getDefaultGroupTitle()", () => {
    it("always returns 'any of'", () => {
        expect(JsonSchemaAnyOfGroup.getDefaultGroupTitle()).toBe("any of");
    });
});
