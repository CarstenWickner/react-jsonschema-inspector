import { JsonSchemaAllOfGroup } from "../../src/model/JsonSchemaAllOfGroup";
import { JsonSchemaGroup } from "../../src/model/JsonSchemaGroup";
import { JsonSchema } from "../../src/model/JsonSchema";

describe("with()", () => {
    /**
     * Minimal implementation of JsonSchemaGroup
     */
    class MockJsonSchemaGroup extends JsonSchemaGroup {
        private treatAsAdditionalColumn: boolean;
        constructor(treatAsAdditionalColumn = false) {
            super();
            this.treatAsAdditionalColumn = treatAsAdditionalColumn;
        }
        considerSchemasAsSeparateOptions(): boolean {
            return this.treatAsAdditionalColumn;
        }
    }

    it("adds given JsonSchema to entries", () => {
        const schema = new JsonSchema(true, {});
        const targetGroup = new JsonSchemaAllOfGroup();
        const returnedGroup = targetGroup.with(schema);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([schema]);
        const otherSchema = new JsonSchema(true, {});
        targetGroup.with(otherSchema);
        expect(targetGroup.entries).toEqual([schema, otherSchema]);
    });
    it("extracts single entry from given JsonSchemaGroup", () => {
        const otherEntry = new JsonSchema(true, {});
        const otherGroup = new MockJsonSchemaGroup().with(otherEntry);
        const targetGroup = new JsonSchemaAllOfGroup();
        const returnedGroup = targetGroup.with(otherGroup);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([otherEntry]);
    });
    it("adds given JsonSchemaGroup (with more than one entry, and shouldTreatEntriesAsOne() === false) to this group's entries", () => {
        const otherGroup = new MockJsonSchemaGroup(true).with(new JsonSchema(true, {})).with(new JsonSchema(true, {}));
        const targetGroup = new JsonSchemaAllOfGroup();
        const returnedGroup = targetGroup.with(otherGroup);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([otherGroup]);
    });
    it("adds entries of given JsonSchemaGroup (with shouldTreatEntriesAsOne() === true) 's to this group's entries", () => {
        const entryOne = new JsonSchema(true, {});
        const entryTwo = new JsonSchema(true, {});
        const otherGroup = new MockJsonSchemaGroup(false).with(entryOne).with(entryTwo);
        const targetGroup = new JsonSchemaAllOfGroup();
        const returnedGroup = targetGroup.with(otherGroup);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([entryOne, entryTwo]);
    });
    it("adds nested entries of given JsonSchemaGroup (with shouldTreatEntriesAsOne() === true) to this group's entries", () => {
        const nestedEntryOne = new JsonSchema(true, {});
        const nestedEntryTwo = new JsonSchema(true, {});
        const singleNestedEntryThree = new JsonSchema(true, {});
        const nestedGroupNotLikeAllOf = new MockJsonSchemaGroup(true).with(new JsonSchema(true, {})).with(new JsonSchema(true, {}));
        const otherGroup = new MockJsonSchemaGroup(false)
            .with(new MockJsonSchemaGroup(false).with(nestedEntryOne).with(nestedEntryTwo))
            .with(new MockJsonSchemaGroup(true).with(singleNestedEntryThree))
            .with(nestedGroupNotLikeAllOf);
        const targetGroup = new JsonSchemaAllOfGroup();
        const returnedGroup = targetGroup.with(otherGroup);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([nestedEntryOne, nestedEntryTwo, singleNestedEntryThree, nestedGroupNotLikeAllOf]);
    });
});
