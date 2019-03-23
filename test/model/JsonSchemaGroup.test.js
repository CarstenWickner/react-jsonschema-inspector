import JsonSchemaGroup from "../../src/model/JsonSchemaGroup";
import JsonSchema from "../../src/model/JsonSchema";

describe("constructor", () => {
    class MockJsonSchemaGroup extends JsonSchemaGroup {
        shouldBeTreatedLikeAllOf() { return true; }
    }
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
            testType                                       | GroupClass             | parameters
            ${"shouldBeTreatedLikeAllOf() is not present"} | ${JsonSchemaGroup}     | ${[JsonSchema]}
            ${"missing JsonSchema reference"}              | ${MockJsonSchemaGroup} | ${[undefined]}
        `("throws error when $testType", ({ GroupClass, parameters }) => {
            try {
                const successfullyInitialisedGroup = new GroupClass(...parameters);
                expect(successfullyInitialisedGroup).toBeUndefined();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
            }
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
            testType                                       | GroupClass             | parameters
            ${"shouldBeTreatedLikeAllOf() is not present"} | ${JsonSchemaGroup}     | ${[JsonSchema]}
            ${"missing JsonSchema reference"}              | ${MockJsonSchemaGroup} | ${[undefined]}
        `("throws no error when $testType", ({ GroupClass, parameters }) => {
            expect(new GroupClass(...parameters)).toBeInstanceOf(GroupClass);
        });
    });
});

/**
 * Minimal implementation of JsonSchemaGroup
 */
class MockJsonSchemaGroup extends JsonSchemaGroup {
    constructor(treatLikeAllOf = true) {
        super(JsonSchema);
        this.treatLikeAllOf = treatLikeAllOf;
    }
    shouldBeTreatedLikeAllOf() { return this.treatLikeAllOf; }
}

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
describe("getProperties() / getPropertiesFromEntry()", () => {
    it("extracts properties from single JsonSchema entry", () => {
        const rawFooSchema = { type: "object" };
        const group = new MockJsonSchemaGroup()
            .with(new JsonSchema({
                properties: { foo: rawFooSchema }
            }));
        const result = group.getProperties();
        expect(Object.keys(result)).toHaveLength(1);
        expect(result.foo).toBeInstanceOf(JsonSchema);
        expect(result.foo.schema).toEqual(rawFooSchema);
    });
    it("extracts required from single JsonSchema entry", () => {
        const group = new MockJsonSchemaGroup()
            .with(new JsonSchema({
                required: ["foo", "bar"]
            }));
        const result = group.getProperties();
        expect(Object.keys(result)).toHaveLength(2);
        expect(result.foo).toBeInstanceOf(JsonSchema);
        expect(result.foo.schema).toBe(true);
        expect(result.bar).toBeInstanceOf(JsonSchema);
        expect(result.bar.schema).toBe(true);
    });
    it("no error if no properties or required in single JsonSchema entry", () => {
        const group = new MockJsonSchemaGroup().with(new JsonSchema(true));
        expect(group.getProperties()).toEqual({});
    });
    describe("combined properties and required", () => {
        const rawFooSchema = { title: "Test Title" };
        const requiredArray = ["foo", "bar"];
        const singleEntryGroup = new MockJsonSchemaGroup()
            .with(new JsonSchema({
                required: requiredArray,
                properties: { foo: rawFooSchema }
            }));
        const twoEntriesGroup = new MockJsonSchemaGroup()
            .with(new JsonSchema({
                properties: { foo: rawFooSchema }
            }))
            .with(new JsonSchema({ required: requiredArray }));
        it.each`
            testTitle                         | group
            ${"from single JsonSchema entry"} | ${singleEntryGroup}
            ${"from two JsonSchema entries"}  | ${twoEntriesGroup}
        `("$testTitle", ({ group }) => {
            const result = group.getProperties();
            expect(Object.keys(result)).toHaveLength(2);
            expect(result.foo).toBeInstanceOf(JsonSchema);
            expect(result.foo.schema).toEqual(rawFooSchema);
            expect(result.bar).toBeInstanceOf(JsonSchema);
            expect(result.bar.schema).toBe(true);
        });
    });
    describe("extracts properties from nested group", () => {
        it("returns flat result if groups' shouldBeTreatedLikeAllOf() === true", () => {
            const rawFooSchema = { type: "object" };
            const rawBarSchema = { title: "bar" };
            const rawBazSchema = { description: "baz" };
            const group = new MockJsonSchemaGroup(true)
                .with(new JsonSchema({
                    properties: { foo: rawFooSchema }
                }))
                .with(new MockJsonSchemaGroup(true)
                    .with(new JsonSchema({
                        properties: { bar: rawBarSchema }
                    }))
                    .with(new JsonSchema({
                        properties: { baz: rawBazSchema }
                    })));
            const result = group.getProperties();
            expect(Object.keys(result)).toHaveLength(3);
            expect(result.foo).toBeInstanceOf(JsonSchema);
            expect(result.foo.schema).toEqual(rawFooSchema);
            expect(result.bar).toBeInstanceOf(JsonSchema);
            expect(result.bar.schema).toEqual(rawBarSchema);
            expect(result.baz).toBeInstanceOf(JsonSchema);
            expect(result.baz.schema).toEqual(rawBazSchema);
        });
    });
    describe("returns partial result if groups' shouldBeTreatedLikeAllOf() === false", () => {
        const rawBazSchema = { description: "baz" };
        const rawFooSchema = { type: "object" };
        const rawBarSchema = { title: "bar" };
        const rawFoobarSchema = { minProperties: 2 };
        const group = new MockJsonSchemaGroup(false)
            .with(new JsonSchema({
                properties: { baz: rawBazSchema }
            }))
            .with(new MockJsonSchemaGroup(true)
                .with(new MockJsonSchemaGroup(false)
                    .with(new JsonSchema({
                        properties: { foo: rawFooSchema }
                    }))
                    .with(new JsonSchema({
                        properties: { bar: rawBarSchema }
                    })))
                .with(new JsonSchema({
                    properties: { foobar: rawFoobarSchema }
                })));

        it("from single JsonSchema option", () => {
            const result = group.getProperties([
                { index: 0 }
            ]);
            expect(Object.keys(result)).toHaveLength(1);
            expect(result.baz).toBeInstanceOf(JsonSchema);
            expect(result.baz.schema).toEqual(rawBazSchema);
        });
        it("from nested JsonSchemaGroup option #1", () => {
            const result = group.getProperties([
                { index: 1 },
                { index: 0 }
            ]);
            expect(Object.keys(result)).toHaveLength(2);
            expect(result.foo).toBeInstanceOf(JsonSchema);
            expect(result.foo.schema).toEqual(rawFooSchema);
            expect(result.foobar).toBeInstanceOf(JsonSchema);
            expect(result.foobar.schema).toEqual(rawFoobarSchema);
        });
        it("from nested JsonSchemaGroup option #2", () => {
            const result = group.getProperties([
                { index: 1 },
                { index: 1 }
            ]);
            expect(Object.keys(result)).toHaveLength(2);
            expect(result.bar).toBeInstanceOf(JsonSchema);
            expect(result.bar.schema).toEqual(rawBarSchema);
            expect(result.foobar).toBeInstanceOf(JsonSchema);
            expect(result.foobar.schema).toEqual(rawFoobarSchema);
        });
    });
});
describe("getOptions()", () => {
    describe("when shouldBeTreatedLikeAllOf() === true", () => {
        it("ignores JsonSchema entries ", () => {
            const group = new MockJsonSchemaGroup(true)
                .with(new JsonSchema())
                .with(new JsonSchema());
            expect(group.getOptions()).toEqual({});
        });
        it("ignores nested groups only containing JsonSchema entries when nested groups also have shouldBeTreatedLikeAllOf() === true", () => {
            const group = new MockJsonSchemaGroup(true)
                .with(
                    new MockJsonSchemaGroup(true)
                        .with(new JsonSchema())
                        .with(new JsonSchema())
                )
                .with(
                    new MockJsonSchemaGroup(true)
                        .with(
                            new MockJsonSchemaGroup(true)
                                .with(new JsonSchema())
                                .with(new JsonSchema())
                        )
                        .with(new JsonSchema())
                );
            expect(group.getOptions()).toEqual({});
        });
    });
    describe("when shouldBeTreatedLikeAllOf() === false", () => {
        it("represents JsonSchema entries as empty arrays", () => {
            const group = new MockJsonSchemaGroup(false)
                .with(new JsonSchema())
                .with(new JsonSchema());
            expect(group.getOptions()).toEqual({
                options: [
                    {},
                    {}
                ]
            });
        });
        it("represents hierarchy of nested groups that also have shouldBeTreatedLikeAllOf() === false", () => {
            const group = new MockJsonSchemaGroup(false)
                .with(
                    new MockJsonSchemaGroup(false)
                        .with(new JsonSchema())
                        .with(new JsonSchema())
                )
                .with(
                    new MockJsonSchemaGroup(false)
                        .with(
                            new MockJsonSchemaGroup(false)
                                .with(new JsonSchema())
                                .with(new JsonSchema())
                        )
                        .with(new JsonSchema())
                );
            expect(group.getOptions()).toEqual({
                options: [
                    {
                        options: [
                            {},
                            {}
                        ]
                    },
                    {
                        options: [
                            {
                                options: [
                                    {},
                                    {}
                                ]
                            },
                            {}
                        ]
                    }
                ]
            });
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
