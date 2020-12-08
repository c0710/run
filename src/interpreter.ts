import Visitor from "./visitor";
import * as ESTree from "estree";
class Interpreter {
    private visitor: Visitor;
    constructor(visitor: Visitor) {
        this.visitor = visitor;
    }
    interpret(node: ESTree.Node) {
        this.visitor.visitNode(node);
    }
}
export default Interpreter;
