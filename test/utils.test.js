import {
    isDefined, isNonEmptyObject, mapObjectValues, mergeObjects, listValues
} from "../src/utils";

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
    it("accepts falsy: \"\"", () => {
        expect(isDefined("")).toBe(true);
    });
    it("accepts falsy: ''", () => {
        // eslint-disable-next-line quotes
        expect(isDefined('')).toBe(true);
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
    it("accepts truthy: \"string\"", () => {
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
    it("rejects non-object: \"string\"", () => {
        expect(isNonEmptyObject("string")).toBe(false);
    });
    it("rejects empty array: []", () => {
        expect(isNonEmptyObject(["value"])).toBe(false);
    });
    it("rejects non-empty array: [{key:\"value\"}]", () => {
        expect(isNonEmptyObject([{ key: "value" }])).toBe(false);
    });
    it("rejects empty object: {}", () => {
        expect(isNonEmptyObject({})).toBe(false);
    });
    it("accepts non-empty object: { key: \"value\" }", () => {
        expect(isNonEmptyObject({ key: "value" })).toBe(true);
    });
});
describe("mapObjectValues()", () => {
    it("returns new empty object for empty input", () => {
        const inputObject = {};
        const outputObject = mapObjectValues(inputObject);
        expect(outputObject).toEqual({});
        expect(outputObject === inputObject).toBe(false);
    });
    it("returns mapped object without changing input object", () => {
        const inputObject = { key: 4 };
        const outputObject = mapObjectValues(inputObject, value => value * 2);
        expect(outputObject).toEqual({ key: 8 });
        expect(inputObject).toEqual({ key: 4 });
    });
    it("returns mapped object with multiple keys", () => {
        const inputObject = {
            a: "Albert",
            b: "Brenda",
            c: "Carl"
        };
        const outputObject = mapObjectValues(inputObject, name => `Hello ${name}!`);
        expect(outputObject).toEqual({
            a: "Hello Albert!",
            b: "Hello Brenda!",
            c: "Hello Carl!"
        });
    });
});
describe("mergeObjects()", () => {
    it("returns second param if first param is undefined", () => {
        const secondParam = { title: "something" };
        expect(mergeObjects(undefined, secondParam)).toEqual(secondParam);
    });
    it("returns second param if first param is null", () => {
        const secondParam = { title: "something" };
        expect(mergeObjects(null, secondParam)).toEqual(secondParam);
    });
    it("returns second param if first param is not an object", () => {
        const secondParam = { title: "something" };
        expect(mergeObjects("not an object", secondParam)).toEqual(secondParam);
    });
    it("returns second param if first param is empty object", () => {
        const secondParam = { title: "something" };
        expect(mergeObjects({}, secondParam)).toEqual(secondParam);
    });
    it("returns first param if second param is undefined", () => {
        const firstParam = { title: "something" };
        expect(mergeObjects(firstParam, undefined)).toEqual(firstParam);
    });
    it("returns first param if second param is null", () => {
        const firstParam = { title: "something" };
        expect(mergeObjects(firstParam, null)).toEqual(firstParam);
    });
    it("returns first param if second param is not an object", () => {
        const firstParam = { title: "something" };
        expect(mergeObjects(firstParam, "not an object")).toEqual(firstParam);
    });
    it("returns first param if second param is empty object", () => {
        const firstParam = { title: "something" };
        expect(mergeObjects(firstParam, {})).toEqual(firstParam);
    });
    it("returns unchanged param if both are the same", () => {
        const param = { title: "something" };
        expect(mergeObjects(param, param)).toEqual(param);
    });
    it("returns single merged object if both params are non empty objects", () => {
        const firstParam = { title: "something" };
        const secondParam = { description: "text" };
        const result = mergeObjects(firstParam, secondParam);
        expect(result).toEqual({
            title: "something",
            description: "text"
        });
        // ensure that the original objects remain unchanged
        expect(result).not.toEqual(firstParam);
        expect(result).not.toEqual(secondParam);
    });
});
describe("listValues()", () => {
    it("returns second param if first param is undefined", () => {
        const secondParam = "something";
        expect(listValues(undefined, secondParam)).toEqual(secondParam);
    });
    it("returns second param if first param is null", () => {
        const secondParam = "something";
        expect(listValues(null, secondParam)).toEqual(secondParam);
    });
    it("returns first param if second param is undefined", () => {
        const firstParam = "text";
        expect(listValues(firstParam, undefined)).toEqual(firstParam);
    });
    it("returns first param if second param is null", () => {
        const firstParam = "text";
        expect(listValues(firstParam, null)).toEqual(firstParam);
    });
    it("returns unchanged param if both are the same", () => {
        const param = { title: "something" };
        expect(listValues(param, param)).toEqual(param);
    });
    it("returns combined array if both params are arrays", () => {
        const firstParam = [1, 2];
        const secondParam = [3, 4];
        expect(listValues(firstParam, secondParam)).toEqual([1, 2, 3, 4]);
        expect(firstParam).toHaveLength(2);
        expect(secondParam).toHaveLength(2);
    });
    it("returns combined array if first param is an array", () => {
        const firstParam = [1, 2];
        const secondParam = 3;
        expect(listValues(firstParam, secondParam)).toEqual([1, 2, 3]);
        expect(firstParam).toHaveLength(2);
    });
    it("returns combined array if second param is an array", () => {
        const firstParam = 1;
        const secondParam = [2, 3];
        expect(listValues(firstParam, secondParam)).toEqual([1, 2, 3]);
        expect(secondParam).toHaveLength(2);
    });
    it("returns combined array if params are not the same", () => {
        const firstParam = 1;
        const secondParam = 2;
        expect(listValues(firstParam, secondParam)).toEqual([1, 2]);
    });
});
