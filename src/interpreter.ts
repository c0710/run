import Visitor from './visitor';
import Scope, { ScopeType } from './Scope';
import * as ESTree from 'estree';
import ES5 from './ES5';

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
    constructor() {
        this.scope = {} as Scope;
    }
    interpret(node: ESTree.Node, options) {
        this.createScope();
        this.injectOption(options);
        evaluate(node, this.scope);

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

/**
 * 执行节点方法
 *
 * @param node AST 节点
 * @param scope 作用域对象
 */
export function evaluate(node: ESTree.Node, scope: Scope) {
    const visitor = ES5[node.type];
    // 不支持的 AST 类型
    if (!visitor) {
        throw new Error("[runjs] Unsupported node: " + node.type);
    }
    // console.log(node.type);
    return visitor(node, scope);
}

export default Interpreter;
