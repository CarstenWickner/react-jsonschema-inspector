import { isDefined, isNonEmptyObject, mapObjectValues, minimumValue, maximumValue, listValues, commonValues } from "../../src/model/utils";

describe("isDefined()", () => {
    it("rejects undefined", () => {
        expect(isDefined(undefined)).toBe(false);
    });
    it("rejects null", () => {
        expect(isDefined(null)).toBe(false);
    });
    it("accepts falsy: false", () => {
        expect(isDefined(false)).toBe(true);
    });
    it("accepts falsy: 0", () => {
        expect(isDefined(0)).toBe(true);
    });
    it('accepts falsy: ""', () => {
        expect(isDefined("")).toBe(true);
    });
    it("accepts falsy: ''", () => {
        // eslint-disable-next-line quotes
        expect(isDefined("")).toBe(true);
    });
    it("accepts falsy: ``", () => {
        // eslint-disable-next-line quotes
        expect(isDefined(``)).toBe(true);
    });
    it("accepts truthy: 1", () => {
        // eslint-disable-next-line quotes
        expect(isDefined(1)).toBe(true);
    });
    it("accepts truthy: []", () => {
        // eslint-disable-next-line quotes
        expect(isDefined([])).toBe(true);
    });
    it("accepts truthy: {}", () => {
        // eslint-disable-next-line quotes
        expect(isDefined({})).toBe(true);
    });
    it('accepts truthy: "string"', () => {
        // eslint-disable-next-line quotes
        expect(isDefined("string")).toBe(true);
    });
});
describe("isNonEmptyObject()", () => {
    it("rejects undefined", () => {
        expect(isNonEmptyObject(undefined)).toBe(false);
    });
    it("rejects null", () => {
        expect(isNonEmptyObject(null)).toBe(false);
    });
    it("rejects non-object: 1", () => {
        expect(isNonEmptyObject(1)).toBe(false);
    });
    it('rejects non-object: "string"', () => {
        expect(isNonEmptyObject("string")).toBe(false);
    });
    it("rejects empty array: []", () => {
        expect(isNonEmptyObject(["value"])).toBe(false);
    });
    it('rejects non-empty array: [{key:"value"}]', () => {
        expect(isNonEmptyObject([{ key: "value" }])).toBe(false);
    });
    it("rejects empty object: {}", () => {
        expect(isNonEmptyObject({})).toBe(false);
    });
    it('accepts non-empty object: { key: "value" }', () => {
        expect(isNonEmptyObject({ key: "value" })).toBe(true);
    });
});
describe("mapObjectValues()", () => {
    it("returns new empty object for empty input", () => {
        const inputObject = {};
        const outputObject = mapObjectValues(inputObject, (value) => value);
        expect(outputObject).toEqual({});
        expect(outputObject === inputObject).toBe(false);
    });
    it("returns mapped object without changing input object", () => {
        const inputObject = { key: 4 };
        const outputObject = mapObjectValues(inputObject, (value) => value * 2);
        expect(outputObject).toEqual({ key: 8 });
        expect(inputObject).toEqual({ key: 4 });
    });
    it("returns mapped object with multiple keys", () => {
        const inputObject = {
            a: "Albert",
            b: "Brenda",
            c: "Carl"
        };
        const outputObject = mapObjectValues(inputObject, (name) => `Hello ${name}!`);
        expect(outputObject).toEqual({
            a: "Hello Albert!",
            b: "Hello Brenda!",
            c: "Hello Carl!"
        });
    });
});
describe("nullAwareReduce()", () => {
    it.each`
        testDescription                                       | firstParam   | secondParam  | result
        ${"returns second param if first param is undefined"} | ${undefined} | ${1}         | ${1}
        ${"returns second param if first param is null"}      | ${null}      | ${2}         | ${2}
        ${"returns first param if second param is undefined"} | ${3}         | ${undefined} | ${3}
        ${"returns first param if second param is null"}      | ${4}         | ${null}      | ${4}
    `("$testDescription", ({ firstParam, secondParam, result }) => {
        expect(minimumValue(firstParam, secondParam)).toEqual(result);
        expect(maximumValue(firstParam, secondParam)).toEqual(result);
        expect(listValues(firstParam, secondParam)).toEqual(result);
        expect(commonValues(firstParam, secondParam)).toEqual(result);
    });
});
describe("minimumValue()", () => {
    it.each`
        testDescription                                      | firstParam | secondParam | result
        ${"returns unchanged param if both are the same"}    | ${5}       | ${5}        | ${5}
        ${"returns first param if that is the lower value"}  | ${6}       | ${9}        | ${6}
        ${"returns second param if that is the lower value"} | ${8}       | ${7}        | ${7}
    `("$testDescription", ({ firstParam, secondParam, result }) => {
        expect(minimumValue(firstParam, secondParam)).toEqual(result);
    });
});
describe("maximumValue()", () => {
    it.each`
        testDescription                                       | firstParam | secondParam | result
        ${"returns unchanged param if both are the same"}     | ${5}       | ${5}        | ${5}
        ${"returns first param if that is the higher value"}  | ${6}       | ${1}        | ${6}
        ${"returns second param if that is the higher value"} | ${5}       | ${7}        | ${7}
    `("$testDescription", ({ firstParam, secondParam, result }) => {
        expect(maximumValue(firstParam, secondParam)).toEqual(result);
    });
});
describe("listValues()", () => {
    it.each`
        testDescription                                              | firstParam | secondParam | result
        ${"returns unchanged param if both are the same"}            | ${"foo"}   | ${"foo"}    | ${"foo"}
        ${"returns combined array if both params are arrays"}        | ${[1, 2]}  | ${[3, 4]}   | ${[1, 2, 3, 4]}
        ${"returns combined array if only first param is an array"}  | ${[1, 2]}  | ${3}        | ${[1, 2, 3]}
        ${"returns combined array if only second param is an array"} | ${1}       | ${[2, 3]}   | ${[1, 2, 3]}
        ${"returns combined array if params are not the same"}       | ${1}       | ${2}        | ${[1, 2]}
    `("$testDescription", ({ firstParam, secondParam, result }) => {
        expect(listValues(firstParam, secondParam)).toEqual(result);
    });
});
describe("commonValues()", () => {
    it.each`
        testDescription                                                                        | firstParam   | secondParam  | result
        ${"returns unchanged param if both are the same"}                                      | ${"foo"}     | ${"foo"}     | ${"foo"}
        ${"returns intersection value if both params are arrays"}                              | ${[1, 2]}    | ${[2, 3]}    | ${2}
        ${"returns intersection of values if both params are arrays"}                          | ${[1, 2, 3]} | ${[4, 3, 2]} | ${[2, 3]}
        ${"returns empty array if both params are arrays without intersecting values"}         | ${[1, 2]}    | ${[3, 4]}    | ${[]}
        ${"returns contained second param value if first param is an array"}                   | ${[1, 2]}    | ${2}         | ${2}
        ${"returns empty array if second param value is not in first param which is an array"} | ${[1, 2]}    | ${3}         | ${[]}
        ${"returns contained first param value if second param is an array"}                   | ${1}         | ${[1, 2]}    | ${1}
        ${"returns empty array if first param value is not in second param which is an array"} | ${1}         | ${[2, 3]}    | ${[]}
        ${"returns empty array if params are distinct non-array values"}                       | ${1}         | ${2}         | ${[]}
    `("$testDescription", ({ firstParam, secondParam, result }) => {
        expect(commonValues(firstParam, secondParam)).toEqual(result);
    });
});
