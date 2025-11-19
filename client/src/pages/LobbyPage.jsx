import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useSocket } from '../SocketContext';

export default function LobbyPage() {
    const [mode, setMode] = useState('join'); //will be used to determine 'join' or 'create'
    const [roomCode, setRoomCode] = useState('');
    const [maxRounds, setMaxRounds] = useState(3);
    const [roundDuration, setRoundDuration] = useState(80);
    const [maxPlayers, setMaxPlayers] = useState(8);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    // const [socket, setSocket] = useState(null);
    const socket = useSocket();
    const navigate = useNavigate();

    //retreive the user from localStorage
    const user = JSON.parse(localStorage.getItem('user'));


    //if the person tries to enter this page without begin logged in
    //redirect to main page

    useEffect(() => {
        //debug
        console.log("useEffect triggered");
        
        if (!user) {
            navigate('/');
            return;
        }
    
        //here we initialize a new socket connection
        //(different locations for production and development)
        if (!socket) {return;}
        
        //helper functions
        const handleRoomCreated = (data) => {
            navigate(`/room/${data.roomCode}`);
        };

        const handleRoomJoined = (data) => {
            navigate(`/room/${data.room.roomCode}`);
        };

        const handleError = (data) => {
            setError(data.message);
            setLoading(false);
        };

        // Listen to events
        socket.on('room-created', handleRoomCreated);
        socket.on('room-joined', handleRoomJoined);
        socket.on('error', handleError);

        return () => {
            socket.off('room-created', handleRoomCreated);
            socket.off('room-joined', handleRoomJoined);
            socket.off('error', handleError);
        };
    }, []);

    const handleCreateRoom = (event) => {
        event.preventDefault();
        setError('');

        //firstly, validate inputs
        if (maxRounds < 1 || maxRounds > 10) {
            setError('Rounds must be between 1 and 10');
            return;
        }

        if (roundDuration < 30 || roundDuration > 300) {
            setError('Round duration must be between 30 and 300 seconds');
            return;
        }

        if (maxPlayers < 2 || maxPlayers > 8) {
            setError('Max players must be between 2 and 8');
            return;
        }

        //all conditions passed
        setLoading(true);

        //emit the create-room event
        socket.emit('create-room', {
            userId: user._id,
            username: user.username,
            maxRounds: parseInt(maxRounds),
            roundDuration: parseInt(roundDuration),
            maxPlayers: parseInt(maxPlayers)
        });
    };

    const handleJoinRoom = (event) => {
        event.preventDefault();
        setError('');

        if (!roomCode || roomCode.length < 4) {
            setError('Please enter a valid room code');
            return;
        }

        //all conditions passed
        setLoading(true);

        //emit the join-room event
        socket.emit('join-room', {
            userId: user._id,
            username: user.username,
            roomCode: roomCode.toUpperCase() //removes case sensitivity of user input
        });
    };

    //in case the user logs out
    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div style={{
            minHeight: '100vh',
            padding: '20px',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px',
                color: 'white',
            }}>
                <h1 style={{margin: 0}}>🎨 Sketchy</h1>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <span>Welcome, <strong>{user?.username}</strong></span>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '8px 16px',
                            color: 'white',
                            backgroundColor: 'rgba(255, 255, 255 0.2)',
                            border: '1px solid white',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}>
                            Logout
                    </button>
                </div>
            </div>
            
            <div style={{
                maxWidth: '500px',
                margin: '0 auto',
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '12px',
            }}>
                <h2 style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                    color: 'black',
                }}>
                    Join or Create a Room!
                </h2>

                <div style={{
                    display: 'flex',
                    marginBottom: '30px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '4px'
                }}>
                    <button
                        onClick={() => setMode('join')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: mode === 'join' ? 'cornflowerblue' : 'transparent',
                            color: mode === 'join' ? 'white' : 'grey'
                        }}>
                            Join Room
                    </button>
                    <button
                        onClick={() => setMode('create')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: mode === 'create' ? 'cornflowerblue' : 'transparent',
                            color: mode === 'create' ? 'white' : 'grey'
                        }}>
                            Create Room
                    </button>
                </div>

                {/* These are the forms for join room */}
                {mode === 'join' && (
                    <form onSubmit={handleJoinRoom}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'grey',
                            }}>
                                Room Code
                            </label>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(evt) => setRoomCode(evt.target.value.toUpperCase())}
                                placeholder="Enter room code (ex: ABC123)"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid grey',
                                    borderRadius: '8px',
                                    fontSize: '18px',
                                    textAlign: 'center',
                                    textTransform: 'uppercase',
                                    boxSizing: 'border-box'
                                }}/>
                        </div>
                        {error && (
                            <div style={{
                                padding: '10px',
                                color: 'red',
                                fontSize: '14px',
                                marginBottom: '20px',
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '8px',
                                fontSize: '16px',
                            }}>
                                {loading ? 'Joining...' : 'Join Room'}
                        </button>
                    </form>
                )}

                {/* these are the forms for creating a room */}
                {mode === 'create' && (
                    <form onSubmit={handleCreateRoom}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'grey',
                            }}>
                                Number of Rounds (1-10)
                            </label>
                            <input
                                type="number"
                                value={maxRounds}
                                onChange={(evt) => setMaxRounds(evt.target.value)}
                                min={1}
                                max={10}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid grey',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    boxSizing: 'border-box'
                                }}/>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'grey',
                            }}>
                                Round Duration (30-300 seconds)
                            </label>
                            <input 
                                type="number"
                                value={roundDuration}
                                onChange={(evt) => setRoundDuration(evt.target.value)}
                                min={30}
                                max={300}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid grey',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    boxSizing: 'border-box'
                                }}/>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'grey',
                            }}>
                                Maximum Players (2-8)
                            </label>
                            <input 
                                type="number"
                                value={maxPlayers}
                                onChange={(evt) => setMaxPlayers(evt.target.value)}
                                min={2}
                                max={8}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid grey',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    boxSizing: 'border-box'
                                }}/>
                        </div>

                        {error && (
                            <div style={{
                                padding: '10px',
                                color: 'red',
                                fontSize: '14px',
                                marginBottom: '20px',
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '8px',
                                fontSize: '16px',
                            }}>
                                {loading ? 'Creating...' : 'Create Room'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}