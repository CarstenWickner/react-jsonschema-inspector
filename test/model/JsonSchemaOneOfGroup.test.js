import JsonSchemaOneOfGroup from "../../src/model/JsonSchemaOneOfGroup";

describe("getDefaultGroupTitle()", () => {
    it("always returns 'one of'", () => {
        expect(JsonSchemaOneOfGroup.getDefaultGroupTitle()).toBe("one of");
    });
});
