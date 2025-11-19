import mongoose from 'mongoose';

mongoose.connect(process.env.DSN);

//a lot of these are uneccessary to track and update so I dont want to anymore :C
//plus its useless to keep these stats cause they dont show up anywhere anyway
//this pertains to totalscore, wins, gamesplayed 
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    }, 
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    totalScore: {
        type: Number,
        default: 0,
        min: 0,
    }, 
    gamesPlayed: {
        type: Number,
        default: 0,
        min: 0,
    },
    wins: {
        type: Number,
        default: 0,
        min: 0,
    }
});

//subschema for players that are embedded in the gameroom
const PlayerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    score: {
        type: Number,
        default: 0,
    }, 
    hasGuessed: {
        type: Boolean,
        default: false,
    }
}, { _id: false });

const chatMessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    username: String,
    message: String,
    isCorrestGuess: {
        type: Boolean,
        default: false,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
}, { _id: false });

const GameRoomSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        minlength: 4,
        maxlength: 8,
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    players: [PlayerSchema],
    maxPlayers: {
        type: Number,
        default: 8,
        min: 2, 
        max: 8
    },
    currentDrawerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    currentWord: {
        type: String,
        default: null
    },
    wordSet: { 
        type: Boolean, 
        default: false 
    },
    round: {
        type: Number,
        default: 1,
        min: 1,
    },
    maxRounds: {
        type: Number,
        default: 3,
        min: 1,
        max: 10,
    },
    roundStartTime: {
        type: Date,
        default: null,
    },
    roundDuration: {
        type: Number,
        default: 80,
    },
    status: {
        type: String,
        enum: ['waiting', 'active', 'finished'],
        default: 'waiting',
    }, 
    drawingData: {
        type: Array,
        default: [],
    },
    chatHistory: [chatMessageSchema]
});

//need to call this as statics otherwise it would inifitely load
//statics called on the model
//methods called on an instance
GameRoomSchema.statics.generateRoomCode = function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

//this one may be entirely unncessary... (not sure how to retreive this and use it on the front end)
GameRoomSchema.methods.getWordHint = function() {
    if (!this.currentWord) {return '';}
    return this.currentWord.split('').map(() => '_').join(' ');
};

mongoose.model('User', UserSchema);
mongoose.model('GameRoom', GameRoomSchema);

export default mongoose;