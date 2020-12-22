import * as ESTree from 'estree';
import Scope from './Scope';
import { evaluate } from './interpreter';
import { Signal, SignalType } from './signal';

const es5 = {
    // 根节点  对它的body属性进行遍历,然后访问该节点
    Program(node: ESTree.Program, scope:Scope) {
        node.body.forEach(bodyNode => evaluate(bodyNode, scope))
    },

    // 表达式节点
    ExpressionStatement(node: ESTree.ExpressionStatement, scope:Scope) {
        evaluate(node.expression, scope)
    },

    // 字面量节点处理直接求值
    Literal(node: ESTree.Literal) {
        // 正则
        if ((<ESTree.RegExpLiteral>node).regex) {
            const { pattern, flags } = (<ESTree.RegExpLiteral>node).regex;
            return new RegExp(pattern, flags);
        } else {
            return node.value
        }
    },

    // 二元运算符
    // 对left/node两个节点(Literal)进行求值,然后实现operator类型运算,返回结果。
    BinaryExpression(node: ESTree.BinaryExpression, scope:Scope) {
        const leftNode = evaluate(node.left, scope);
        const operator = node.operator;
        const rightNode = evaluate(node.right, scope);

        return {
            '+': (l, r) => l + r,
            '-': (l, r) => l - r,
            '*': (l, r) => l * r,
            '/': (l, r) => l / r,
            '%': (l, r) => l % r,
            '<': (l, r) => l < r,
            '>': (l, r) => l > r,
            '<=': (l, r) => l <= r,
            '>=': (l, r) => l >= r,
            '==': (l, r) => l == r,
            '===': (l, r) => l === r,
            '!=': (l, r) => l != r,
            '!==': (l, r) => l !== r,
        }[operator](leftNode, rightNode);
    },


    // 声明变量
    VariableDeclaration(node: ESTree.VariableDeclaration, scope: Scope) {
        const { declarations, kind } = node;

        // declarations为数组，因为会存在同时声明多个变量 如： let a = 1, b = 2;
        declarations.forEach(declaration => {
            const { id, init } = declaration;
            const key = (<ESTree.Identifier>id).name;
            const value = init ? evaluate(init, scope) : undefined;

            // 声明定义
            scope.$declare(kind, key, value)
        })
    },

    // 函数声明
    FunctionDeclaration(node: ESTree.FunctionDeclaration, scope: Scope) {
        if (node.id) {
            scope.$const(node.id.name, es5.FunctionExpression(node, scope));
        }
    },

    // 函数表达式
    FunctionExpression(node: ESTree.FunctionExpression | ESTree.FunctionDeclaration, scope: Scope) {
        return function(...args) {
            const funcScope = new Scope('function', scope);
            funcScope.$const("this", this);
            funcScope.$const("arguments", arguments);
            node.params.forEach((param, index) => {
                if (param.type === "Identifier") {
                    funcScope.$const(param.name, args[index]);
                } else {
                    // TODO rest参数
                }
            });
            const result = evaluate(node.body, funcScope);
            if (Signal.isReturn(result)) {
                return (result as Signal).value;
            }
        }
    },

    // 块语句节点
    // 模拟创建一个块作用域,然后遍历body属性进行访问即可。
    BlockStatement(node: ESTree.BlockStatement, scope: Scope) {
        const blockScope = new Scope("block", scope);
        const { body } = node;
        for (const n of body) {
            const result = evaluate(n, blockScope);
            if (result instanceof Signal) {
                return result;
            }
        }
    },

    // 函数调用
    CallExpression(node: ESTree.CallExpression, scope: Scope) {
        const { callee } = node;
        const fn = evaluate(callee, scope);
        const args = node.arguments.map((arg) => evaluate(arg, scope));
        if (callee.type === "MemberExpression") {
            const context = evaluate(callee.object, scope);
            return fn.apply(context, args);
        } else {
            const name = (<ESTree.Identifier>(node.callee)).name;
            const context = scope.$get(name);
            return fn.apply(context ? context.value : null, args);
        }
    },

    // if节点
    IfStatement(node: ESTree.IfStatement, scope: Scope) {
        const { test, consequent, alternate } = node;
        // 判断条件
        const testRes = evaluate(test, scope);
        // consequent为判断为真之后的操作、alternate为假后的操作
        if (testRes) return evaluate(consequent, scope);
        else return alternate ? evaluate(alternate, scope) : undefined;
    },

    // for节点
    ForStatement(node: ESTree.ForStatement, scope: Scope) {
        const { init, test, update, body } = node;
        const forScope = new Scope("block", scope);

        for (
            init ? evaluate(init, forScope) : null;
            test ? evaluate(test, forScope) : true;
            update ? evaluate(update, forScope) : null
        ) {
            const res = evaluate(body, forScope);
            if (Signal.isBreak(res)) break;
            if (Signal.isContinue(res)) continue;
            if (Signal.isReturn(res)) return res.result;
        }

    },

    // 更新节点
    UpdateExpression(node: ESTree.UpdateExpression, scope: Scope) {
        const { prefix, argument, operator } = node;
        let updateVar;

        if (argument.type === 'Identifier') {
            updateVar = scope.$get(argument.name)
        } else if (argument.type === "MemberExpression") {
            //对象成员表达式类型
            const { object, property, computed } = argument;
            const obj = evaluate(object, scope);
            const key = computed
                ? evaluate(property, scope)
                : (<ESTree.Identifier>property).name;
            updateVar = {
                get value() {
                    return obj[key];
                },
                set value(v) {
                    obj[key] = v;
                },
            };
        }
        return {
            "++": (v) => {
                const result = v.value;
                v.value = result + 1;
                return prefix ? v.value : result;
            },
            "--": (v) => {
                const result = v.value;
                v.value = result - 1;
                return prefix ? v.value : result;
            },
        }[operator](updateVar);

    },


    // return 节点
    ReturnStatement(node: ESTree.ReturnStatement, scope: Scope) {
        return new Signal(
            SignalType.return,
            node.argument ? evaluate(node.argument, scope) : undefined
        );
    },

    // 标识符（变量名）根据作用域去找对应的值 然后返回
    Identifier(node: ESTree.Identifier, scope: Scope) {
        const { name }  = node;
        const variable = scope.$get(name);
        if (variable) return variable.value;
    },

    // 对象属性类的值 如 obj.a、console.log
    MemberExpression(node: ESTree.MemberExpression, scope:Scope) {
        const { object, property, computed } = node;

        // 如果computed为true时 说明是通过obj[property]的方式来访问，property为一个Expression节点，如果computed为false则property为一个Identifier
        const key = computed ? evaluate(property, scope) : (<ESTree.Identifier>property).name;

        const obj = evaluate(object, scope);

        return obj[key]
    },


    // 赋值表达式节点
    AssignmentExpression(node: ESTree.AssignmentExpression, scope: Scope){
        const { left, operator, right } = node;

        let assignVar;

        // 标识符类型
        if (left.type === 'Identifier') {
            assignVar = scope.$get(left.name);
        } else if (left.type === 'MemberExpression') {
            //对象成员表达式类型
            const { object, property, computed } = left;
            const obj = evaluate(object, scope);
            const key = computed
                ? evaluate(property, scope)
                : (<ESTree.Identifier>property).name;
            assignVar = {
                get value() {
                    return obj[key];
                },
                set value(v) {
                    obj[key] = v;
                },
            };
        }

        return {
            '=': (v) => {
                assignVar.value = v;
                return v;
            },
            '+=': (v) => {
                const value = assignVar.value;
                assignVar.value = v + value;
                return assignVar.value;
            },
            '-=': (v) => {
                const value = assignVar.value;
                assignVar.value = value - v;
                return assignVar.value;
            },
            '*=': (v) => {
                const value = assignVar.value;
                assignVar.value = v * value;
                return assignVar.value;
            },
            '/=': (v) => {
                const value = assignVar.value;
                assignVar.value = value / v;
                return assignVar.value;
            },
            '%=': (v) => {
                const value = assignVar.value;
                assignVar.value = value % v;
                return assignVar.value;
            },
        }[operator](evaluate(right, scope))
    }
};

export default es5
