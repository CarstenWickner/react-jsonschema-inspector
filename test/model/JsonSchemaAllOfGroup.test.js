import JsonSchemaAllOfGroup from "../../src/model/JsonSchemaAllOfGroup";
import JsonSchemaGroup from "../../src/model/JsonSchemaGroup";
import JsonSchema from "../../src/model/JsonSchema";

describe("with()", () => {
    /**
     * Minimal implementation of JsonSchemaGroup
     */
    class MockJsonSchemaGroup extends JsonSchemaGroup {
        constructor(treatAsAdditionalColumn = false) {
            super();
            this.treatAsAdditionalColumn = treatAsAdditionalColumn;
        }
        considerSchemasAsSeparateOptions() { return this.treatAsAdditionalColumn; }
    }

    it("adds given JsonSchema to entries", () => {
        const schema = new JsonSchema();
        const targetGroup = new JsonSchemaAllOfGroup(JsonSchema);
        const returnedGroup = targetGroup.with(schema);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([schema]);
        const otherSchema = new JsonSchema();
        targetGroup.with(otherSchema);
        expect(targetGroup.entries).toEqual([schema, otherSchema]);
    });
    it("extracts single entry from given JsonSchemaGroup", () => {
        const otherEntry = new JsonSchema();
        const otherGroup = new MockJsonSchemaGroup().with(otherEntry);
        const targetGroup = new JsonSchemaAllOfGroup(JsonSchema);
        const returnedGroup = targetGroup.with(otherGroup);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([otherEntry]);
    });
    it("adds given JsonSchemaGroup (with more than one entry, and shouldTreatEntriesAsOne() === false) to this group's entries", () => {
        const otherGroup = new MockJsonSchemaGroup(true)
            .with(new JsonSchema())
            .with(new JsonSchema());
        const targetGroup = new JsonSchemaAllOfGroup(JsonSchema);
        const returnedGroup = targetGroup.with(otherGroup);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([otherGroup]);
    });
    it("adds entries of given JsonSchemaGroup (with shouldTreatEntriesAsOne() === true) 's to this group's entries", () => {
        const entryOne = new JsonSchema();
        const entryTwo = new JsonSchema();
        const otherGroup = new MockJsonSchemaGroup(false)
            .with(entryOne)
            .with(entryTwo);
        const targetGroup = new JsonSchemaAllOfGroup(JsonSchema);
        const returnedGroup = targetGroup.with(otherGroup);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([entryOne, entryTwo]);
    });
    it("adds nested entries of given JsonSchemaGroup (with shouldTreatEntriesAsOne() === true) to this group's entries", () => {
        const nestedEntryOne = new JsonSchema();
        const nestedEntryTwo = new JsonSchema();
        const singleNestedEntryThree = new JsonSchema();
        const nestedGroupNotLikeAllOf = new MockJsonSchemaGroup(true)
            .with(new JsonSchema())
            .with(new JsonSchema());
        const otherGroup = new MockJsonSchemaGroup(false)
            .with(new MockJsonSchemaGroup(false).with(nestedEntryOne).with(nestedEntryTwo))
            .with(new MockJsonSchemaGroup(true).with(singleNestedEntryThree))
            .with(nestedGroupNotLikeAllOf);
        const targetGroup = new JsonSchemaAllOfGroup(JsonSchema);
        const returnedGroup = targetGroup.with(otherGroup);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([
            nestedEntryOne,
            nestedEntryTwo,
            singleNestedEntryThree,
            nestedGroupNotLikeAllOf
        ]);
    });
});
