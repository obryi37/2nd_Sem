const express = require("express");
const expressSanitizer = require("express-sanitizer");

// Importing the fs and https modules -------------- STEP 1
const https = require("https");
const fs = require("fs");

// Read the certificate and the private key for the https server options
// ------------------- STEP 2
const options = {
    key: fs.readFileSync("./config/cert.key"),
    cert: fs.readFileSync("./config/cert.crt"),
};

// Initialize instance of express
const app = express();

// Init Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount express-sanitizer middleware here
app.use(expressSanitizer());

// Server static html file to check if the server is working 
app.use("/", express.static("public"));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

const PORT = 8000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

// Create the https server by initializing it with 'options'
// -------------------- STEP 3
const server = https.createServer(options, app);
const { Server } = require('socket.io')
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('rotationX', (val) => {
        io.emit('rotationX', val);
    })
    socket.on('rotationY', (val) => {
        io.emit('rotationY', val);
    })
    socket.on('rotationZ', (val) => {
        io.emit('rotationZ', val);
    })
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })
})

server.listen(8080, () => {
    console.log(`HTTPS server started on port 8080`);
});
