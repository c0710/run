import Visitor from './visitor';
import Scope, { ScopeType } from './Scope';
import * as ESTree from 'estree';

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

class Interpreter {
    private scope: Scope;
    private visitor: Visitor;
    constructor(visitor: Visitor) {
        this.visitor = visitor;
        this.scope = {} as Scope;
    }
    interpret(node: ESTree.Node, options) {
        this.createScope();
        this.injectOption(options);
        this.visitor.visitNode(node, this.scope);

        // 与外部 js 环境通信
        return this.scope.$getValue('$exports');
    }

    createScope() {
        const type:ScopeType = 'block';
        this.scope =  new Scope(type);

        // 注入常量
        this.scope.$const('this', null);

        // 注入全局api
        for(const api in GLOBAL_API) {
            this.scope.$const(api, GLOBAL_API[api])
        }
    }

    // 注入外部变量
    injectOption(options) {
        this.scope.$const('$exports', options?.$exports || {});
    }
}
export default Interpreter;
