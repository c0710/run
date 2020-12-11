const acorn = require("acorn");
import Visitor from "./visitor";
import Interpreter from "./interpreter";

const jsInterpreter = new Interpreter(new Visitor());

export function run(code: string, options?) {
    const root = acorn.parse(code, {
        ecmaVersion: 8,
        sourceType: "script",
    });
    return jsInterpreter.interpret(root, options);
}

//
const code = `
    $exports=6;
`;

console.log(run(code));
