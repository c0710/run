import { run } from "../src/main";
describe("run es5", () => {
    test("assign", () => {
        expect(
            run(`
              1+1
            `)
        ).toBe(2);
    });
}
