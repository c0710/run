import { run } from "../src/main";

describe("run es5", () => {
    test("assign", () => {
        const code = '$exports = 123';
        expect(run(code)).toBe(123);
    });
});
