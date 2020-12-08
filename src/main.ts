const acorn = require("acorn");
import Visitor from "./visitor";
import Interpreter from "./interpreter";

const GLOBAL_API: { [key: string]: any } = {
    console,

    setTimeout,
    setInterval,

    clearTimeout,
    clearInterval,

    encodeURI,
    encodeURIComponent,
    decodeURI,
    decodeURIComponent,
    escape,
    unescape,

    Infinity,
    NaN,
    isFinite,
    isNaN,
    parseFloat,
    parseInt,
    Object,
    Boolean,
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
    Number,
    Math,
    Date,
    String,
    RegExp,
    Array,
    JSON,
    Promise
};



const jsInterpreter = new Interpreter(new Visitor());

export function run(code: string) {
    const root = acorn.parse(code, {
        ecmaVersion: 8,
        sourceType: "script",
    });
    return jsInterpreter.interpret(root);
}
