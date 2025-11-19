import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useSocket } from '../SocketContext';

export default function WaitingRoom() {
    const { roomCode } = useParams(); //gets the room code from the url
    // const [socket, setSocket] = useState(null);
    const socket = useSocket();
    const [room, setRoom] = useState(null);
    const [players, setPlayers] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        if (!socket) {return;}

        //join the room
        socket.emit('join-room', {
            userId: user._id,
            username: user.username,
            roomCode: roomCode
        });

        //helper fucntions were generated to prevent console spam (did not work)
        const handleRoomJoined = (data) => {
            // console.log('Room data:', (data));
            setRoom(data.room);
            setPlayers(data.room.players);
        };

        const handlePlayerJoined = (data) => {
            // console.log('Player joined:', (data));
            setPlayers(data.players);
        };

        const handleError = (data) => {
            setError(data.message);
        };

        const handleGameStarted = (data) => {
            navigate(`/game/${roomCode}`);
        };
        
        //here we listen for a confirmations of room joining, player joining, errors, and game starting
        socket.on('room-joined', handleRoomJoined);
        socket.on('player-joined', handlePlayerJoined);
        socket.on('error', handleError);
        socket.on('game-started', handleGameStarted);


        return () => {
            socket.off('room-joined', handleRoomJoined);
            socket.off('player-joined', handlePlayerJoined);
            socket.off('error', handleError);
            socket.off('game-started', handleGameStarted);
        };
    }, [socket, roomCode, user, navigate]);

    //function for the start game button
    const handleStartGame = () => {
        if (players.length < 2) {return;}

        socket.emit('start-game', { roomCode });
    };

    //question mark here as well to make sure that the room exists first
    const isHost = room?.hostId === user._id;

    //this is hear to safeguard in case the room is still null
    //seems to be a consistent issue if the socket is not connecting???
    if (!room) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px'
            }}>
                Loading room...
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            padding: '40px 20px'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    <h1 style={{
                        margin: '0 0 10px 0',
                        color: 'black'
                        
                    }}>
                        Waiting Room
                    </h1>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}>
                        <span style={{color: 'red', fontWeight: '700', fontSize: '20px'}}>Room Code: </span>
                        <div style={{
                            padding: '10px 20px',
                            backgroundColor: 'cornflowerblue', 
                            color: 'white',
                            borderRadius: '8px',
                            fontSize: '24px',
                            letterSpacing: '4px'
                        }}>
                            { roomCode }
                        </div>
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '20px'
                }}>
                    <h3 style={{
                        marginTop: 0,
                        color: 'grey'
                    }}>
                        Game Settings
                    </h3>
                    <div style={{
                        display: 'grid',
                        gap: '15px',
                    }}>
                        <div>
                            <strong style={{ color: 'cornflowerblue' }}>Rounds:</strong>
                            <span style={{ marginLeft: '10px', color: 'black', fontWeight: '700' }}>{ room.maxRounds }</span>
                        </div>
                        <div>
                            <strong style={{ color: 'cornflowerblue' }}>Time per Round:</strong>
                            <span style={{ marginLeft: '10px', color: 'black', fontWeight: '700' }}>{ room.roundDuration }s</span>
                        </div>
                    </div>
                </div>
                
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                }}>
                    <h3 style={{
                        marginTop: 0,
                        color: 'grey'
                    }}>
                        Players ({players.length})
                    </h3>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        {players.map((player, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '15px',
                                    backgroundColor: player.userId === user._id ? 'lightblue' : 'lightgrey',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: player.userId === user._id ? '2px solid cornflowerblue' : 'none'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <span style={{ fontSize: '16px', color: 'black' }}>{player.username}</span>
                                    {player.userId === room.hostId && (
                                        <span style={{
                                            padding: '2px 8px',
                                            backgroundColor: 'gold',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                        }}>
                                            👑
                                        </span>
                                    )} 
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'center'
                }}>
                    {isHost && (
                        <button
                            onClick={handleStartGame}
                            disabled={players.length < 2}
                            style={{
                                padding: '14px 28px',
                                backgroundColor: players.length < 2 ? 'grey' : 'mediumseagreen',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                cursor: 'pointer'
                            }}
                            title={players.length < 2 ? 'Need at least 2 players to start' : 'Start the game'}
                        >
                            Start Game
                        </button>
                    )}
                </div>
                
                {!isHost && (
                    <p style={{
                        textAlign: 'center',
                        color: 'white',
                        marginTop: '20px',
                        fontSize: '14px'
                    }}>
                        Waiting for the host to start the game...
                    </p>
                )}
            </div>
        </div>
    );
}