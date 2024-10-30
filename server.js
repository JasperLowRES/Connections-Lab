const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));
app.use(express.json());

// Store fliers in memory (in a real app, you'd use a database)
let fliers = [];

io.on('connection', (socket) => {
    console.log('User connected');
    
    // Send existing fliers to new connections
    socket.emit('init-fliers', fliers);

    // Handle new flier creation
    socket.on('add-flier', (flier) => {
        fliers.push(flier);
        // Broadcast to all clients
        io.emit('new-flier', flier);
    });

    // Handle flier deletion
    socket.on('delete-flier', (id) => {
        fliers = fliers.filter(flier => flier.id !== id);
        io.emit('flier-deleted', id);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
