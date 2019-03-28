import JsonSchemaAllOfGroup from "../../src/model/JsonSchemaAllOfGroup";
import JsonSchemaGroup from "../../src/model/JsonSchemaGroup";
import JsonSchema from "../../src/model/JsonSchema";

describe("shouldBeTreatedLikeAllOf()", () => {
    it("always returns true", () => {
        const group = new JsonSchemaAllOfGroup(JsonSchema);
        expect(group.shouldBeTreatedLikeAllOf()).toBe(true);
    });
});
describe("with()", () => {
    /**
     * Minimal implementation of JsonSchemaGroup
     */
    class MockJsonSchemaGroup extends JsonSchemaGroup {
        constructor(treatLikeAllOf = false) {
            super(JsonSchema);
            this.treatLikeAllOf = treatLikeAllOf;
        }
        shouldBeTreatedLikeAllOf() { return this.treatLikeAllOf && super.shouldBeTreatedLikeAllOf(); }
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
    it("adds given JsonSchemaGroup (with more than one entry, and shouldBeTreatedLikeAllOf() === false) to this group's entries", () => {
        const otherGroup = new MockJsonSchemaGroup(false)
            .with(new JsonSchema())
            .with(new JsonSchema());
        const targetGroup = new JsonSchemaAllOfGroup(JsonSchema);
        const returnedGroup = targetGroup.with(otherGroup);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([otherGroup]);
    });
    it("adds entries of given JsonSchemaGroup (with shouldBeTreatedLikeAllOf() === true) 's to this group's entries", () => {
        const entryOne = new JsonSchema();
        const entryTwo = new JsonSchema();
        const otherGroup = new MockJsonSchemaGroup(true)
            .with(entryOne)
            .with(entryTwo);
        const targetGroup = new JsonSchemaAllOfGroup(JsonSchema);
        const returnedGroup = targetGroup.with(otherGroup);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([entryOne, entryTwo]);
    });
    it("adds nested entries of given JsonSchemaGroup (with shouldBeTreatedLikeAllOf() === true) 's to this group's entries", () => {
        const nestedEntryOne = new JsonSchema();
        const nestedEntryTwo = new JsonSchema();
        const singleNestedEntryThree = new JsonSchema();
        const nestedGroupNotLikeAllOf = new MockJsonSchemaGroup(false)
            .with(new JsonSchema())
            .with(new JsonSchema());
        const otherGroup = new MockJsonSchemaGroup(true)
            .with(new MockJsonSchemaGroup(true).with(nestedEntryOne).with(nestedEntryTwo))
            .with(new MockJsonSchemaGroup(false).with(singleNestedEntryThree))
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
