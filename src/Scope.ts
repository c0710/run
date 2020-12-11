import {Kind, KindType, Variable} from "./variable";

export type ScopeType = "block" | "function";

export class Scope {
    // 父作用域
    private parent: Scope | null;
    // 当前作用域
    private targetScope: Map<any, any>;

    // 当前作用域类型
    private readonly type:ScopeType;

    constructor(type: ScopeType, parent?: Scope) {
        this.parent = parent || null;
        this.type = type;
        this.targetScope = new Map();
    }

    $var(name: string, value: any) {
        let scope: Scope = this;

        // 如果此时不是全局作用域 也不是函数作用域
        while (scope.parent && scope.type === "block") {
            scope = scope.parent;
        }

        // 存储变量
        scope.targetScope.set(name, new Variable(Kind.var, value))
    }

    $let(name: string, value: any) {
        if (this.targetScope.has(name)) {
            throw `不允许重复定义${name}`
        }
        // 存储变量
        this.targetScope.set(name, new Variable(Kind.let, value))
    }

    $const(name: string, value: any) {
        if (this.targetScope.has(name)) {
            throw `不允许重复定义${name}`
        }
        // 存储变量
        this.targetScope.set(name, new Variable(Kind.const, value))
    }

    $get(name: string): Variable | null {
        if (this.targetScope.get(name)) {
            return this.targetScope.get(name)
        } else if (this.parent) {
            return this.parent.$get(name);
        } else {
            return null;
        }
    }

    $getValue(name: string): any {
        return this.$get(name) !== null ? (this.$get(name) as Variable).value : null;
    }

    // 变量声明方法,变量已定义则抛出语法错误异常
    $declare(type: Kind | KindType, name: string, value: any) {
        if (Boolean(this.$get(name))) {
            console.error(`Identifier '${name}' has already been declared`)
            return true;
        }
        return {
            var: this.$var.bind(this),
            let: this.$let.bind(this),
            const: this.$const.bind(this),
        }[type](name, value);
    }
}


export default Scope;
