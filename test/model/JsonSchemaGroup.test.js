/* eslint-disable class-methods-use-this */
import JsonSchemaGroup from "../../src/model/JsonSchemaGroup";
import JsonSchema from "../../src/model/JsonSchema";

describe("constructor", () => {
    class MockJsonSchemaGroupWithoutConstructor extends JsonSchemaGroup {
        shouldBeTreatedLikeAllOf() { return true; }

        getOptions() { return []; }
    }
    class MockJsonSchemaGroupWithoutShouldBeTreatedLikeAllOf extends JsonSchemaGroup {
        constructor() { super(JsonSchema); }

        getOptions() { return []; }
    }
    class MockJsonSchemaGroupWithoutGetOptions extends JsonSchemaGroup {
        constructor() { super(JsonSchema); }

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
            testType                                         | GroupClass
            ${"initialised directly"}                        | ${JsonSchemaGroup}
            ${"missing JsonSchema reference in constructor"} | ${MockJsonSchemaGroupWithoutConstructor}             
            ${"shouldBeTreatedLikeAllOf() is not present"}   | ${MockJsonSchemaGroupWithoutShouldBeTreatedLikeAllOf}
            ${"getOptions() is not present"}                 ] ${MockJsonSchemaGroupWithoutGetOptions}
        `("throws error when $testType", ({ GroupClass }) => {
            try {
                const successfullyInitialisedGroup = new GroupClass();
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
            testType                                         | GroupClass
            ${"initialised directly"}                        | ${JsonSchemaGroup}
            ${"missing JsonSchema reference in constructor"} | ${MockJsonSchemaGroupWithoutConstructor}             
            ${"shouldBeTreatedLikeAllOf() is not present"}   | ${MockJsonSchemaGroupWithoutShouldBeTreatedLikeAllOf}
            ${"getOptions() is not present"}                 ] ${MockJsonSchemaGroupWithoutGetOptions}
        `("throws no error when $testType", ({ GroupClass }) => {
            expect(new GroupClass()).toBeInstanceOf(GroupClass);
        });
    });
});

/**
 * Minimal implementation of JsonSchemaGroup
 */
class MockJsonSchemaGroup extends JsonSchemaGroup {
    constructor() {
        super(JsonSchema);
    }

    shouldBeTreatedLikeAllOf() { return true; }

    getOptions() { return []; }
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
});
