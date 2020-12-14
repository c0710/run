const acorn = require("acorn");
import Visitor from "./visitor";
import Interpreter from "./interpreter";

const jsInterpreter = new Interpreter();

export function run(code: string, options?) {
    const root = acorn.parse(code, {
        ecmaVersion: 8,
        sourceType: "script",
    });
    return jsInterpreter.interpret(root, options);
}

//
const code = `
    function fn(a, b) {
        return a + b
    }
    $exports = fn(10, 1);
`;

console.log(run(code));
// run(code);
