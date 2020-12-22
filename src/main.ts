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
    for(var i = 0; i < 5; i++) {
        console.log(i)
    }
    
    $exports = i
`;

console.log(run(code));
// run(code);
