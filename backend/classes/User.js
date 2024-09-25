class User {
    constructor(username, password, role, major, id) {
        this.username = username;
        this.password = password;
        this.role = role;
        this.major = major;
        this.elevated = false; // Default value
        this.id = id;
        this.savedRoutes = []; // Array to store Route objects
        this.position = null;
        this.altitude = 0.0;
        this.rotation = 0.0;
    }

    getUserData(userID) {
        return {
            username: this.username,
            role: this.role,
            major: this.major,
            id: this.id
        };
    }

    addRoom(name) {
        console.log(`Adding room: ${name}`);
    }

    getFavRoute() {
        console.log(`Getting favorite route`);
    }

    setUsername(username) {
        this.username = username;
    }

    createRoute(start, finish) {
        console.log('Creating a Room');
    }
}