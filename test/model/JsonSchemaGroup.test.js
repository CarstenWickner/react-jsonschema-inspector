import JsonSchemaGroup from "../../src/model/JsonSchemaGroup";
import JsonSchema from "../../src/model/JsonSchema";

/**
 * Minimal implementation of JsonSchemaGroup
 */
class MockJsonSchemaGroup extends JsonSchemaGroup {
    constructor(treatLikeAllOf = true) {
        super();
        this.treatLikeAllOf = treatLikeAllOf;
    }
    shouldBeTreatedLikeAllOf() { return this.treatLikeAllOf; }
}

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

        it("throws error when shouldBeTreatedLikeAllOf() is not present", () => {
            expect(() => new JsonSchemaGroup()).toThrow();
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

        it("throws no error when shouldBeTreatedLikeAllOf() is not present", () => {
            expect(new JsonSchemaGroup()).toBeInstanceOf(JsonSchemaGroup);
        });
    });
});
describe("with()", () => {
    it("adds given JsonSchema to entries", () => {
        const schema = new JsonSchema();
        const targetGroup = new MockJsonSchemaGroup();
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
        const targetGroup = new MockJsonSchemaGroup();
        const returnedGroup = targetGroup.with(otherGroup);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([otherEntry]);
    });
    it("adds given JsonSchemaGroup (with more than one entry) to this group's entries", () => {
        const otherGroup = new MockJsonSchemaGroup()
            .with(new JsonSchema())
            .with(new JsonSchema());
        const targetGroup = new MockJsonSchemaGroup();
        const returnedGroup = targetGroup.with(otherGroup);
        expect(returnedGroup).toBe(targetGroup);
        expect(targetGroup.entries).toEqual([otherGroup]);
    });
});
describe("extractValues()/extractValuesFromEntry()", () => {
    describe("when shouldBeTreatedLikeAllOf() === true", () => {
        it("calling given extractFromSchema() function on single schema entry", () => {
            const extractFromSchema = jest.fn()
                .mockReturnValueOnce(10)
                .mockReturnValueOnce("foo")
                .mockReturnValueOnce(false);
            const entry = new JsonSchema(true);
            const group = new MockJsonSchemaGroup(true).with(entry);

            expect(group.extractValuesFromEntry(entry, extractFromSchema)).toBe(10);
            expect(extractFromSchema.mock.calls).toHaveLength(1);
            expect(extractFromSchema.mock.calls[0][0]).toBe(entry);

            expect(group.extractValuesFromEntry(entry, extractFromSchema)).toBe("foo");
            expect(extractFromSchema.mock.calls).toHaveLength(2);
            expect(extractFromSchema.mock.calls[1][0]).toBe(entry);

            expect(group.extractValuesFromEntry(entry, extractFromSchema)).toBe(false);
            expect(extractFromSchema.mock.calls).toHaveLength(3);
            expect(extractFromSchema.mock.calls[2][0]).toBe(entry);
        });
        it("calling extractValues() recursively on group entry", () => {
            const group = new MockJsonSchemaGroup(true)
                .with(new MockJsonSchemaGroup(true)
                    .with(new JsonSchema({ title: "foo" }))
                    .with(new JsonSchema({ description: "bar" })));
            const extractFromSchema = ({ schema }) => schema;
            const mergeResults = (combined, nextValue) => Object.assign({}, combined, nextValue);
            const defaultValue = {};
            expect(group.extractValues(extractFromSchema, mergeResults, defaultValue)).toEqual({
                title: "foo",
                description: "bar"
            });
        });
    });
    describe("when shouldBeTreatedLikeAllOf() === false", () => {
        it.each`
            conditionText                      | optionTargetIn     | optionTargetOut
            ${"is undefined"}                  | ${undefined}       | ${undefined}
            ${"is empty array"}                | ${[]}              | ${[]}
            ${"has one item with index > 1"}   | ${[{ index: 4 }]}  | ${[{ index: 3 }]}
            ${"has one item with index === 1"} | ${[{ index: 1 }]}  | ${[{ index: 0 }]}
            ${"has one item with index < 0"}   | ${[{ index: -2 }]} | ${[{ index: -3 }]}
        `("returns given defaultValue if optionTarget $conditionText", ({ optionTargetIn, optionTargetOut }) => {
            const group = new MockJsonSchemaGroup(false).with(new JsonSchema(true));
            expect(group.extractValues(
                null,
                (combined, nextValue) => `${combined}, ${nextValue}`,
                "foobar",
                optionTargetIn
            )).toBe("foobar, foobar");
            expect(optionTargetIn).toEqual(optionTargetOut);
        });
        it("returns merged values when optionTarget index reaches 0", () => {
            const group = new MockJsonSchemaGroup(false)
                .with(new JsonSchema(false))
                .with(new MockJsonSchemaGroup(false)
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
        const group = new MockJsonSchemaGroup();
        expect(group.createOptionsRepresentation(containedOptions)).toEqual(representation);
    });
});
