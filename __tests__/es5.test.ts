import { run } from "../src/main";

describe("run es5", () => {
    test("assign", () => {
        const code = '$exports = 123';
        expect(run(code)).toBe(123);
    });
    test("函数声明，执行", () => {
        const code = `
            function fn(a, b) {
                console.log(a + b);
                
                return a + b
            }
            $exports= fn(10, 1)
        `;
        expect(run(code)).toBe(9);
    });

    test("块级作用域 var", () => {
        const code = `
            {
                var a = 1;
            }
            $exports = a;
        `;
        expect(run(code)).toBe(1);
    });
});
