import * as ESTree from "estree";
import es5 from './ES5';

const VISITOR = {
    ...es5,
};

class Visitor {
    // 通过节点类型访问对应的节点方法
    visitNode(node: ESTree.Node) {
        // ...
        return {
            visitNode: this.visitNode,
            ...VISITOR,
        }[node.type](node)
    }
}
export default Visitor;
