import Node, {NodeType} from ("./node_graph.js")

class Graph {
    constructor(sizeX, sizeY) {
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.map = this.createMap();
    }
    createMap() {
        let map = new Array(this.sizeX);
        for (let x = 0; x < this.sizeX; x++) {
            map[x] = new Array(this.sizeY);
            for (let y = 0; y < this.sizeY; y++) {
                map[x][y] = new Node(x, y, NodeType.FLOOR, []);
                // Neighbors not implemented yet. 
                NodeType
            }
        }
        return map;
    }
    // get?(this) {
    //     return this.type;
    // }
}