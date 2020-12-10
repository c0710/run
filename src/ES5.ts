import * as ESTree from "estree";

const es5 = {
    // 根节点  对它的body属性进行遍历,然后访问该节点
    Program(node: ESTree.Program) {
        node.body.forEach(bodyNode => this.visitNode(bodyNode))
    },

    // 表达式节点
    ExpressionStatement(node: ESTree.ExpressionStatement) {
        this.visitNode(node.expression)
    },

    // 字面量节点处理直接求值
    Literal(node: ESTree.Literal) {
        // 正则
        if ((<ESTree.RegExpLiteral>node).regex) {

        } else {
            return node.value
        }
    },

    // 二元运算符
    // 对left/node两个节点(Literal)进行求值,然后实现operator类型运算,返回结果。
    BinaryExpression(node: ESTree.BinaryExpression) {
        const leftNode = this.visitNode(node.left);
        const operator = node.operator;
        const rightNode = this.visitNode(node.right);

        return {
            "+": (l, r) => l + r,
            "-": (l, r) => l - r,
            "*": (l, r) => l * r,
            "/": (l, r) => l / r,
            "%": (l, r) => l % r,
            "<": (l, r) => l < r,
            ">": (l, r) => l > r,
            "<=": (l, r) => l <= r,
            ">=": (l, r) => l >= r,
            "==": (l, r) => l == r,
            "===": (l, r) => l === r,
            "!=": (l, r) => l != r,
            "!==": (l, r) => l !== r,
        }[operator](leftNode, rightNode);
    }
};

export default es5
