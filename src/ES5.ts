import * as ESTree from 'estree';
import Scope from './Scope';

const es5 = {
    // 根节点  对它的body属性进行遍历,然后访问该节点
    Program(node: ESTree.Program, scope:Scope) {
        node.body.forEach(bodyNode => this.visitNode(bodyNode, scope))
    },

    // 表达式节点
    ExpressionStatement(node: ESTree.ExpressionStatement, scope:Scope) {
        this.visitNode(node.expression, scope)
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
        const leftNode = this.visitNode(node.left, scope);
        const operator = node.operator;
        const rightNode = this.visitNode(node.right, scope);

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
            const value = init ? this.visitNode(init, scope) : undefined;

            // 声明定义
            scope.$declare(kind, key, value)
        })
    },


    // 标识符（变量名）根据作用域去找对应的值 然后返回
    Identifier(node: ESTree.Identifier, scope: Scope) {
        const { name }  = node;
        const variable = scope.$get(name);
        if (variable) return variable.value;
    },

    MemberExpression(node: ESTree.MemberExpression, scope:Scope) {
        const { object, property, computed } = node;

        // 如果computed为true时 说明是通过obj[property]的方式来访问，property为一个Expression节点，如果computed为false则property为一个Identifier
        const key = computed ? this.visitNode(property, scope) : (<ESTree.Identifier>property).name;

        const obj = this.visitNode(object);

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
            const obj = this.visitNode(object, scope);
            const key = computed
                ? this.visitNode(property, scope)
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
        }[operator](this.visitNode(right, scope))
    }
};

export default es5
