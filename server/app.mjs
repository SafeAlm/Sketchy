import './config.mjs';
import './db.mjs';
import * as auth from './auth.mjs';

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoSanitize from 'express-mongo-sanitize';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

//import the mongoose models
import mongoose from 'mongoose';
const User = mongoose.model('User');
const GameRoom = mongoose.model('GameRoom');

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//create the http server for socket.io
//(needs acess to the http layer)
const httpServer = createServer(app);

//initialize socket.io server on top of the http server
//(allows connections from react) 
//(primarily handles real time interactions)
//TUTORIAL ALSO USED FOR THIS BIT OF CODE
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173', "https://final-project-sma9098.onrender.com"],
        methods: ['GET', 'POST']
    }
});

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(mongoSanitize());
app.use(cors());

//serve the static files from react build that is in production
//TUTORIAL USED FOR HOW TO SERVE FILES (IM STILL NOT SURE IF THIS IS NECESSARY)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/dist')));
}

//API routes
//for login and register, the json data does not get displayed because it is not fetched (im not bothered to implement this)
app.get('/', (req, res) => {
    res.json({ message: 'sketchy server is runnnig' });
});

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await auth.register(username, password);

        res.json({ 
            success: true,
            user
        });
    } catch (err) {
        const statusCode = err.status || 500;
        const message = err.message || 'Regstration failed';

        res.status(statusCode).json({
            success: false,
            message
        });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await auth.login(username, password);

        res.json({
            success: true,
            user
        });
    } catch(err) {
        const statusCode = err.status || 500;
        const message = err.message || 'Login failed';

        res.status(statusCode).json({
            success: false,
            message,
        });
    }
});

//add some helper functions
//this function will check if all the players have guessed correctly
function checkRoundEnd(room) {
    //get all players EXCEPT for the drawer
    const guessers = room.players.filter(player => player.userId.toString() !== room.currentDrawerId.toString());

    //check if all players have guessed
    const allGuessed = guessers.every(player => player.hasGuessed);

    return allGuessed;
}

//function will pick the next drawer
function getNextDrawer(room) {
    const currentDrawerIndex = room.players.findIndex(
        player => player.userId.toString() === room.currentDrawerId.toString()
    );

    //shift to the next player in line (and wrap around if we reached the end)
    const nextIndex = (currentDrawerIndex + 1) % room.players.length;
    return room.players[nextIndex].userId;
}

async function nextRound(room, roomCode) {
    //checks if the game is over
    if (room.round >= room.maxRounds) {
        room.status = 'finished';
        await room.save();

        //now sort the players in descending order
        const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

        io.to(roomCode).emit('game-ended', {
            players: sortedPlayers,
            winner: sortedPlayers[0]
        });

        //debug console.log
        //console.log(`Game ended in room ${roomCode}`);
        return;
    }

    //if the game is not over, move to next round
    room.round += 1;
    room.currentDrawerId = getNextDrawer(room);
    room.currentWord= null;
    room.wordSet = false;
    room.roundStartTime = null;
    room.drawingData = [];

    //set all players guessed back to false
    room.players.forEach(player => player.hasGuessed = false);

    await room.save();

    io.to(roomCode).emit('round-ended', {
        room,
        nextDrawerId: room.currentDrawerId,
        nextRound: room.round
    });

    //debugging print
    console.log(`Round ${room.round} starting in room ${roomCode}`);
}

//socket.io event handlers
io.on('connection', (socket) => {
    //debug console.log
    console.log('user connected: ', socket.id);

    socket.on('create-room', async (data) => {
        //debug console.log
        console.log('Received create-room event:', data);
        try {
            const { userId, username, maxRounds, roundDuration, maxPlayers } = data;

            //initialize variables and generate our unique room code
            let roomCode;
            let roomExists = true;

            //while loop generates codes until it makes a unique one
            while (roomExists) {
                roomCode = GameRoom.generateRoomCode();
                roomExists = await GameRoom.findOne({ roomCode });
            }

            //crate the room
            const room = await GameRoom.create({
                roomCode, 
                hostId: userId,
                maxRounds: maxRounds || 3,
                roundDuration: roundDuration || 80,
                maxPlayers: maxPlayers || 8,
                players: [{
                    userId,
                    username,
                    score: 0,
                    hasGuessed: false
                }]
            });

            //join socket.io room to broadcast messages to the client that made the room
            socket.join(roomCode);
            socket.userId = userId;
            socket.roomCode = roomCode;

            socket.emit('room-created', {
                roomCode,
                room,
            });

            //debug console.log
            console.log(`room (${roomCode}) by ${username}`);
            
        } catch (err) {
            socket.emit('error', {message: err.message});
        }
    });

    //user joins the the existing room
    socket.on('join-room', async (data) => {
        //debug console.log
        // console.log('Received join-room event:', data);
        
        try {
            const { userId, username, roomCode } = data;

            const room = await GameRoom.findOne({ roomCode });

            if (!room) {
                return socket.emit('error', { message: 'Room not found' });
            }

            if (room.status === 'active') {
                return socket.emit('error', { message: 'The game is already in progress' });
            } else if (room.status === 'finished') {
                return socket.emit('error', { message: 'This game is already finished' });
            }
            

            //check if the user is already in the room
            const alreadyJoined = room.players.some(p => p.userId.toString() === userId);

            if (!alreadyJoined) {
                if (room.players.length >= room.maxPlayers) {
                    return socket.emit('error', { message: 'Room is full. You cannot join.' });
                }   
                room.players.push({
                    userId,
                    username,
                    score: 0,
                    hasGuessed: false,
                });
                await room.save();
            }

            //join socket.io room
            socket.join(roomCode);
            socket.userId = userId;
            socket.roomCode = roomCode;

            //this should notify everyone that a player joined
            io.to(roomCode).emit('player-joined', {
                username,
                players: room.players
            });
            
            //message sent to the person joining
            socket.emit('room-joined', { room });

            //debug console.log
            // console.log(`${username} joined the room ${roomCode}`);
        } catch (err) {
            socket.emit('error', { message: err.message });
        }
    });

    //listens for the start game
    socket.on('start-game', async (data) => {
        try {
            const { roomCode } = data;

            const room = await GameRoom.findOne({ roomCode });

            if (!room) {
                return socket.emit('error', { message: 'Room not found' });
            }

            if (room.hostId.toString() !== socket.userId) {
                return socket.emit('error', { message: 'Only the host can start the game, sorry' });
            }

            if (room.players.length < 2) {
                return socket.emit('error', { message: 'You need at least 2 players to start the game' });
            }

            room.status = 'active';

            //by default we will set the host to go first
            room.currentDrawerId = room.hostId;
            room.round = 1;
            room.roundStartTime = new Date();

            await room.save();

            io.to(roomCode).emit('game-started', {
                room,
                currentDrawerId: room.currentDrawerId,
                round: room.round
            });

            //for debugging
            console.log(`game started in room ${roomCode}`);
        } catch (err) {
            socket.emit('error', { message: err.message });
        }
    });

    //listen for request to retreieve the state of the game
    socket.on('get-game-state', async (data) => {
        try {
            const { roomCode } = data;
            const room = await GameRoom.findOne({ roomCode });

            if (!room) {
                return socket.emit('error', { message: 'Room not found' });
            }

            socket.emit('game-state', { room });
        } catch (err) {
            socket.emit('error', { message: err.message });
        }
    });

    //listen for the drawer setting the word
    socket.on('set-word', async (data) => {
        try {
            const { roomCode, word } = data;
            const room = await GameRoom.findOne({ roomCode });

            if (!room) {return;}

            //make sure the person making the request is actually the drawer
            if (room.currentDrawerId.toString() !== socket.userId) {
                return socket.emit('error', { message: 'only the drawer can set the word to draw' });
            }

            room.currentWord = word.toLowerCase();
            room.wordSet = true;
            room.roundStartTime = new Date();
            await room.save();

            //we notify the drawer that the word has been set
            socket.emit('word-set', { word: word.toLowerCase(), roundDuration: room.roundDuration});

            //notify the word to others BUT dont reveal it
            socket.to(roomCode).emit('word-set', { word: null });

            //for debugging
            console.log(`Word set in room ${roomCode}: ${word}`);
        } catch (err) {
            socket.emit('error', { message: err.message });
        }
    });

    socket.on('guess', async (data) => {
        try {
            const { roomCode, userId, username, message } = data;
            const room = await GameRoom.findOne({ roomCode });

            if (!room) {return;}

            //check that the message entered is a correct guess
            const isCorrect = message.toLowerCase().trim() === room.currentWord;

            if (isCorrect) {
                //locate the player
                const player = room.players.find(p => p.userId.toString() === userId);
                if (player && !player.hasGuessed) {
                    player.score += 50;
                    player.hasGuessed = true;

                    //push the SYSTEM message to chat
                    room.chatHistory.push({
                        userId: null,
                        username: 'SYSTEM',
                        message: `${username} guessed correctly! They earned 50 points!`,
                        isCorrectGuess: isCorrect,
                        timeStamp: new Date()
                    });
                
                }

                //broadcast correct guess
                // io.to(roomCode).emit('correct-guess', {
                //     userId,
                //     username,
                //     players: room.players
                // })

                io.to(roomCode).emit('chat-message', {
                    userId: null,
                    username: 'SYSTEM',
                    message: `${username} guessed correctly! They earned 50 points!`,
                    isCorrectGuess: true
                });

                await room.save();

                if (checkRoundEnd(room)) {
                    setTimeout(async () => {
                        const updatedRoom = await GameRoom.findOne({ roomCode });
                        await nextRound(updatedRoom, roomCode);
                    }, 2000); //delay two seconds to display the final guessed correctly message
                }
            } else {

                //wrong guess gets pushed to chat history
                room.chatHistory.push({
                    userId,
                    username,
                    message,
                    isCorrectGuess: isCorrect,
                    timeStamp: new Date()
                });

                await room.save();

                //boradcast a regular chat message
                io.to(roomCode).emit('chat-message', {
                    userId,
                    username,
                    message,
                    isCorrectGuess: false
                });
            }
        } catch (err) {
            console.error('Guess error: ', err);
        }
    });

    //handle any drawing
    socket.on('draw', async (data) => {
        const { roomCode, strokeData } = data;

        //broadcast to everyone else in the room
        socket.to(roomCode).emit('draw-stroke', strokeData);
    });

    //listen for clearing the canvas
    socket.on('clear-canvas', async (data) => {
        const { roomCode } = data;

        //broadcast to everyone about clearing the canvas
        io.to(roomCode).emit('clear-canvas');
    });

    //listen for the end of the round
    socket.on('round-timeout', async (data) => {
        try {
            const { roomCode } = data;
            const room = await GameRoom.findOne({ roomCode });

            if (!room) {return;}

            await nextRound(room, roomCode);
        } catch (err) {
            console.error('Next round start error:', err);
        }
    });

    //this will just log if a person disconnects
    socket.on('disconnect', () => {
        //debug console.log
        console.log('User disconnected:', socket.id);
    });
});

//this should start the express and the socket.io servers
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`server running on PORT: ${PORT}`);
});

export default app;