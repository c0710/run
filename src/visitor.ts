import * as ESTree from "estree";
import es5 from './ES5';
import Scope from './Scope';

const VISITOR = {
    ...es5,
};

class Visitor {
    // 通过节点类型访问对应的节点方法
    visitNode(node: ESTree.Node, scope:Scope) {
        // ...
        return {
            visitNode: this.visitNode,
            ...VISITOR,
        }[node.type](node, scope);
    }
}
export default Visitor;
