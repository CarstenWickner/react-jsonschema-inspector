import JsonSchemaGroup from "../../src/model/JsonSchemaGroup";
import JsonSchema from "../../src/model/JsonSchema";

/**
 * Minimal implementation of JsonSchemaGroup
 */
class MockJsonSchemaGroup extends JsonSchemaGroup {
    constructor(treatAsAdditionalColumn) {
        super();
        this.treatAsAdditionalColumn = treatAsAdditionalColumn;
    }
    considerSchemasAsSeparateOptions() { return this.treatAsAdditionalColumn; }
}

describe("with()", () => {
    it("adds given JsonSchema to entries", () => {
        const schema = new JsonSchema();
        const targetGroup = new JsonSchemaGroup();
        const returnedGroup = targetGroup.with(schema);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([schema]);
        const otherSchema = new JsonSchema();
        targetGroup.with(otherSchema);
        expect(targetGroup.entries).toEqual([schema, otherSchema]);
    });
    it("extracts single entry from given JsonSchemaGroup", () => {
        const otherEntry = new JsonSchema();
        const otherGroup = new JsonSchemaGroup().with(otherEntry);
        const targetGroup = new JsonSchemaGroup();
        const returnedGroup = targetGroup.with(otherGroup);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([otherEntry]);
    });
    it("adds given JsonSchemaGroup (with more than one entry) to this group's entries", () => {
        const otherGroup = new JsonSchemaGroup()
            .with(new JsonSchema())
            .with(new JsonSchema());
        const targetGroup = new JsonSchemaGroup();
        const returnedGroup = targetGroup.with(otherGroup);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([otherGroup]);
    });
});
describe("someEntry()", () => {
    describe("on group with considerSchemasAsSeparateOptions() === true", () => {
        const group = new MockJsonSchemaGroup(true)
            .with(new JsonSchema({ title: "Foo" }))
            .with(new JsonSchema({ title: "Bar" }));

        it("includes sub-schema in leading option", () => {
            const checkEntry = ({ schema }) => schema.title === "Foo";
            expect(group.someEntry(checkEntry)).toBe(true);
            expect(group.someEntry(checkEntry, [])).toBe(false);
            expect(group.someEntry(checkEntry, [{ index: -1 }])).toBe(false);
            expect(group.someEntry(checkEntry, [{ index: 0 }])).toBe(true);
            expect(group.someEntry(checkEntry, [{ index: 1 }])).toBe(false);
        });
        it("includes sub-schema in trailing option", () => {
            const checkEntry = ({ schema }) => schema.title === "Bar";
            expect(group.someEntry(checkEntry)).toBe(true);
            expect(group.someEntry(checkEntry, [])).toBe(false);
            expect(group.someEntry(checkEntry, [{ index: -1 }])).toBe(false);
            expect(group.someEntry(checkEntry, [{ index: 0 }])).toBe(false);
            expect(group.someEntry(checkEntry, [{ index: 1 }])).toBe(true);
            expect(group.someEntry(checkEntry, [{ index: 2 }])).toBe(false);
        });
        it("supports nested group with considerSchemasAsSeparateOptions() === true", () => {
            const outerGroup = new MockJsonSchemaGroup(true)
                .with(new JsonSchema({ title: "Foobar" }))
                .with(group);
            const checkEntry = ({ schema }) => schema.title === "Foo";
            expect(outerGroup.someEntry(checkEntry)).toBe(true);
            expect(outerGroup.someEntry(checkEntry, [])).toBe(false);
            expect(outerGroup.someEntry(checkEntry, [{ index: 0 }])).toBe(false);
            expect(outerGroup.someEntry(checkEntry, [{ index: 1 }])).toBe(false);
            expect(outerGroup.someEntry(checkEntry, [{ index: 1 }, { index: 0 }])).toBe(true);
            expect(outerGroup.someEntry(checkEntry, [{ index: 1 }, { index: 1 }])).toBe(false);
        });
    });
    describe("on group with considerSchemasAsSeparateOptions() === false", () => {
        const group = new JsonSchemaGroup()
            .with(new JsonSchema({ title: "Foo" }))
            .with(new MockJsonSchemaGroup(true)
                .with(new JsonSchema({ title: "Bar" }))
                .with(new JsonSchema(true)))
            .with(new MockJsonSchemaGroup(true)
                .with(new JsonSchema(true))
                .with(new JsonSchema({ title: "Foobar" })));

        it("always including top-level schema", () => {
            const checkEntry = ({ schema }) => schema.title === "Foo";
            expect(group.someEntry(checkEntry, [{ index: 0 }])).toBe(true);
            expect(group.someEntry(checkEntry, [{ index: 0 }, { index: 0 }])).toBe(true);
            expect(group.someEntry(checkEntry, [{ index: -2 }])).toBe(true);
            expect(group.someEntry(checkEntry, [{ index: 3 }])).toBe(true);
        });
        describe("only including schema in nested group with considerSchemasAsSeparateOptions() === true if indicated by optionTarget", () => {
            it("includes sub-schema in leading option", () => {
                const checkEntry = ({ schema }) => schema.title === "Bar";
                expect(group.someEntry(checkEntry, [{ index: 0 }])).toBe(false);
                expect(group.someEntry(checkEntry, [{ index: 0 }, { index: 0 }])).toBe(true);
                expect(group.someEntry(checkEntry, [{ index: 0 }, { index: 1 }])).toBe(false);
                expect(group.someEntry(checkEntry, [{ index: -2 }])).toBe(false);
                expect(group.someEntry(checkEntry, [{ index: 3 }])).toBe(false);
            });
            it("includes sub-schema in trailing option", () => {
                const checkEntry = ({ schema }) => schema.title === "Foobar";
                expect(group.someEntry(checkEntry, [{ index: 0 }])).toBe(false);
                expect(group.someEntry(checkEntry, [{ index: -2 }])).toBe(false);
                expect(group.someEntry(checkEntry, [{ index: 3 }])).toBe(false);
                expect(group.someEntry(checkEntry, [{ index: 1 }])).toBe(false);
                expect(group.someEntry(checkEntry, [{ index: 1 }, { index: 0 }])).toBe(false);
                expect(group.someEntry(checkEntry, [{ index: 1 }, { index: 1 }])).toBe(true);
            });
        });
    });
});
describe("extractValues()/extractValuesFromEntry()", () => {
    describe("when considerSchemasAsSeparateOptions() === false", () => {
        it("calling given extractFromSchema() function on single schema entry", () => {
            const extractFromSchema = jest.fn()
                .mockReturnValueOnce(10)
                .mockReturnValueOnce("foo")
                .mockReturnValueOnce(false);
            const entry = new JsonSchema(true);
            const group = new JsonSchemaGroup().with(entry);

            expect(group.extractValues(extractFromSchema)).toBe(10);
            expect(extractFromSchema.mock.calls).toHaveLength(1);
            expect(extractFromSchema.mock.calls[0][0]).toBe(entry);

            expect(group.extractValues(extractFromSchema)).toBe("foo");
            expect(extractFromSchema.mock.calls).toHaveLength(2);
            expect(extractFromSchema.mock.calls[1][0]).toBe(entry);

            expect(group.extractValues(extractFromSchema)).toBe(false);
            expect(extractFromSchema.mock.calls).toHaveLength(3);
            expect(extractFromSchema.mock.calls[2][0]).toBe(entry);
        });
        it("calling extractValues() recursively on group entry", () => {
            const group = new JsonSchemaGroup()
                .with(new JsonSchemaGroup()
                    .with(new JsonSchema({ title: "foo" }))
                    .with(new JsonSchema({ description: "bar" })));
            const extractFromSchema = ({ schema }) => schema;
            const mergeResults = (combined, nextValue) => ({ ...combined, ...nextValue });
            const defaultValue = {};
            expect(group.extractValues(extractFromSchema, mergeResults, defaultValue)).toEqual({
                title: "foo",
                description: "bar"
            });
        });
    });
    describe("when considerSchemasAsSeparateOptions() === true", () => {
        it.each`
            conditionText                      | optionTargetIn     | optionTargetOut
            ${"is undefined"}                  | ${undefined}       | ${undefined}
            ${"is empty array"}                | ${[]}              | ${[]}
            ${"has two items with index > 1"}   | ${[{ index: 4 }]}  | ${[{ index: 2 }]}
            ${"has two items with index === 1"} | ${[{ index: 1 }]}  | ${[{ index: -1 }]}
            ${"has two item with index < 0"}   | ${[{ index: -2 }]} | ${[{ index: -4 }]}
        `("returns given defaultValue if optionTarget $conditionText", ({ optionTargetIn, optionTargetOut }) => {
            const group = new MockJsonSchemaGroup(true)
                .with(new JsonSchema(true))
                .with(new JsonSchema(true));
            expect(group.extractValues(
                () => { },
                // eslint-disable-next-line no-nested-ternary
                (combined, nextValue) => (!combined ? nextValue : (nextValue ? `${combined}, ${nextValue}` : combined)),
                "foobar",
                optionTargetIn
            )).toBe("foobar");
            expect(optionTargetIn).toEqual(optionTargetOut);
        });
        it("returns merged values when optionTarget index reaches 0", () => {
            const group = new MockJsonSchemaGroup(true)
                .with(new JsonSchema(false))
                .with(new MockJsonSchemaGroup(true)
                    .with(new JsonSchema({ title: "bar" }))
                    .with(new JsonSchema({ title: "baz" })));
            const extractFromSchema = ({ schema }) => schema.title;
            const mergeResults = (combined, nextValue) => (
                (combined && nextValue)
                    ? `${combined}, ${nextValue}`
                    : combined || nextValue
            );
            const defaultValue = null;
            const optionTarget = [
                { index: 1 },
                { index: 0 }
            ];
            expect(group.extractValues(extractFromSchema, mergeResults, defaultValue, optionTarget)).toBe("bar");
            expect(optionTarget).toEqual([
                { index: -1 },
                { index: -2 }
            ]);
        });
    });
});
describe("createOptionsRepresentation()", () => {
    const wrapperWithTitle = {
        groupTitle: "existing title",
        options: [{}, {}, {}]
    };
    it.each`
        input                        | outcome                  | containedOptions      | representation
        ${"empty options array"}     | ${"empty object"}        | ${[]}                 | ${{}}
        ${"array with length === 1"} | ${"single option entry"} | ${[wrapperWithTitle]} | ${wrapperWithTitle}
        ${"array with length === 2"} | ${"wrapper object"}      | ${[{}, {}]}           | ${{ options: [{}, {}] }}
    `("returns $outcome for $input", ({ containedOptions, representation }) => {
        const group = new JsonSchemaGroup();
        expect(group.createOptionsRepresentation(containedOptions)).toEqual(representation);
    });
});
