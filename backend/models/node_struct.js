class Node {
    constructor(X, Y, type, neighbors) {
        this.X = X
        this.Y = Y
        this.type = type
        this.neighbors = neighbors
    }
    getType(this) {
        return this.type;
    }
}

const NodeType = {
    FLOOR: "Floor",
    ROOM: "Room",
    DOOR: "Door"
};

export default Node;
export {NodeType};

/*

EXAMPLE USAGE:
let new_node = new Node(3, 4, "floor", {nodeWest, nodeNorth, 
                        nodeEast, nodeSouth
                        })

*/