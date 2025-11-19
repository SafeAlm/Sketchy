import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../SocketContext';

export default function GamePage() {
    const { roomCode } = useParams();
    const socket = useSocket();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [players, setPlayers] = useState([]);
    const [currentWord, setCurrentWord] = useState('');
    const [wordInput, setWordInput] = useState('');
    const [showWordModal, setShowWordModal] = useState(false);
    const [guessInput, setGuessInput] = useState('');
    const [chatMessages, setChatMessages] = useState([]);
    const [timeLeft, setTimeLeft] = useState(80);
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        //request the room data
        socket.emit('get-game-state', { roomCode });

        //listen for the initial game state
        socket.on('game-state', (data) => {
            //this will pervent overwriting the final game state
            if (room?.status === 'finished') {return;}
            
            setRoom(data.room);
            setPlayers(data.room.players);
            setCurrentWord(data.room.currentWord || '');
            setChatMessages(data.room.chatHistory || []);

            //if youre the drawer and there is no word currently set
            //show the input modal so that you can put your word in
            if (data.room.currentDrawerId === user._id && !data.room.currentWord) {
                setShowWordModal(true);
            }
        });

        //listen for when the word is finally set
        socket.on('word-set', (data) => {
            setCurrentWord(data.word);
            setShowWordModal(false);
            setRoom(prev => ({...prev, wordSet: true}));
            setTimeLeft(data.roundDuration || 80);
        });

        //listen for any chat messages
        socket.on('chat-message', (data) => {
            setChatMessages(prev => [...prev, data]);
            //update the players list when someone guesses correctly
            if (data.isCorrectGuess) {
                socket.emit('get-game-state', { roomCode });
            }
        });

        //here were gonna listen for a correct guess 
        //(im sure this was unimplemented and now unnecessary but i dont wanna remove it)
        socket.on('correct-guess', (data) => {
            setPlayers(data.players);
            setChatMessages(prev => [...prev, {
                username: 'SYSTEM',
                message: `${data.username} guessed correctly, he gets 50 points!`,
                isCorrectGuess: true
            }]);
        });

        socket.on('draw-stroke', (strokeData) => {
            drawStroke(strokeData);
        });

        socket.on('clear-canvas', () => {
            clearCanvas();
        });

        //listen for a round ended message
        socket.on('round-ended', (data) => {
            //console.log for debugging
            console.log('round dende, next round starting:', data);
            setRoom(data.room);
            setPlayers(data.room.players);
            setCurrentWord('');
            setChatMessages([]);
            clearCanvas();

            //and if youre the next drawer, we show the modal so you can enter your word
            if (data.nextDrawerId === user._id) {
                setShowWordModal(true);
            }
        });

        //listen for game ended
        socket.on('game-ended', (data) => {
            //debug console.log
            console.log('Game ended', data);
            setRoom(prev => ({...prev, status: 'finished', finalPlayers: data.players}));
        });

        return () => {
            socket.off('game-state');
            socket.off('word-set');
            socket.off('chat-message');
            socket.off('correct-guess');
            socket.off('draw-stroke');
            socket.off('clear-canvas');
            socket.off('round-ended');
            socket.off('game-ended');
        };
    }, [socket, roomCode, user, navigate]);

    //this is the timer countdown
    useEffect(() => {   
        if (!room || !room.wordSet) {return;}

        setTimeLeft(room.roundDuration || 80); //initialize the timer

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    //the time is done
                    socket.emit('round-timeout', { roomCode });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000); //run ever 1000 milliseconds

        return () => clearInterval(interval);
    }, [room?.wordSet]);

    //handle the word submission from the drawer 
    const handleWordSubmit = (evt) => {
        evt.preventDefault();
        if (!wordInput.trim()) {return;}

        socket.emit('set-word', {
            roomCode,
            word: wordInput.trim().toLowerCase()
        });
        setWordInput(''); //clear word before sending
    };

    //handle any guess 
    //any message sent to the chat will be considered a guess
    const handleGuessSubmit = (evt) => {
        evt.preventDefault();
        if (!guessInput.trim()) {return;}

        socket.emit('guess', {
            roomCode,
            userId: user._id,
            username: user.username,
            message: guessInput.trim()
        });
        setGuessInput(''); //clear the guess after sending
    };

    //begins drawing with the user clicks 
    const startDrawing = (evt) => {
        if (room?.currentDrawerId !== user._id) {return;}

        setIsDrawing(true);
        const pos = getMousePos(evt);
        lastPos.current = pos; //allows to remember where the last stroke was drawn from
    };

    //draw a line segment as the mouse moves
    const draw = (evt) => {
        if (!isDrawing || room?.currentDrawerId !== user._id) {return;}

        const pos = getMousePos(evt); //current mouse pos
        const strokeData = {
            startX: lastPos.current.x,
            startY: lastPos.current.y,
            endX: pos.x,
            endY: pos.y,
            color: 'black',
            width: 3
        };

        drawStroke(strokeData); //register locally 
        socket.emit('draw', { roomCode, strokeData }); //broadcast to others 
        lastPos.current = pos; //register last position as current to continue movement from there
    };

    //ends drawing when mouse is released or leaves the canvas
    const stopDrawing = () => {
        setIsDrawing(false); 
    };

    //ref is used here because it doesnt change on re renders 
    const lastPos = useRef({ x: 0, y: 0 });

    //this function will convert the raw mouse's position on the screen to coordinates relative to the canvas
    //this makes sure the drawings made are actually relative to the canvas
    //not relative to the screen and drawing in some far off place
    const getMousePos = (evt) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) * (canvas.width / rect.width),
            y: (evt.clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    //draws a line between startx, starty and endx, endy
    const drawStroke = (data) => {
        const canvas = canvasRef.current;  
        if (!canvas) {return;}

        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(data.startX, data.startY);
        ctx.lineTo(data.endX, data.endY);
        ctx.stroke();
    };

    //to clear the canvas we will just fill it with white
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) {return;}
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    //this will emit the act of clearing the canvas so it broadcasts to all the players
    const handleClearCanvas = () => {
        if (room?.currentDrawerId !== user._id) {return;}
        clearCanvas();
        socket.emit('clear-canvas', { roomCode });  
    };

    //this will avoid any error with the game room not loading and then crashing the website
    if (!room) {
        return <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white' }}>
                Loading game...
            </div>;
    }

    //check if the user is the drawer and get the word hint
    const isDrawer = room.currentDrawerId === user._id;

    //this is the same function as that defined in db.mjs, just reused
    const getWordHint = (word) => {
        if (!word) {return '';}
        return word.split('').map(() => '_').join(' ');
    };
    const wordHint = currentWord ? getWordHint(room.currentWord) : 'Waiting for word';

    return (
        <div style={{
            minHeight: '100vh',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{color: 'black'}}>
                    <strong>Round {room.round}/{room.maxRounds}</strong>
                </div>
                <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'black'
                }}>
                    {isDrawer ? `Word: ${currentWord}` : `Hint: ${wordHint}`}
                </div>
                <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: timeLeft < 10 ? 'red' : 'black'
                }}>
                    🕗 {timeLeft}s
                </div>
            </div>
            <div style={{ 
                display: 'flex', 
                gap: '20px',
                flex: 1
            }}>
                <div style={{
                    width: '200px',
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '8px'
                }}>
                    <h3 style={{ marginTop: 0 }}></h3>
                    {players.map((player, index) => (
                        <div
                            key={index}
                            style={{
                                padding: '10px',
                                marginBottom: '8px',
                                backgroundColor: player.hasGuessed ? 'mediumseagreen' : 'black',
                                borderRadius: '4px',
                                border: player.userId === room.currentDrawerId ? '2px solid cornflowerblue' : 'none'
                            }}>
                            <div style={{ fontWeight: '700' }}>
                                {player.username}
                            </div>
                            <div style={{
                                fontSize: '14px',
                                color: 'white'
                            }}>
                                {player.score} pts
                            </div>
                            {player.userId === room.currentDrawerId && <div style={{ fontSize: '12px' }}>📝</div>}
                        </div>
                    ))}    
                </div>

                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '15px',
                        borderRadius: '8px'
                    }}>
                        <canvas
                            ref={canvasRef}
                            width={800}
                            height={500}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            style={{
                                border: '2px solid lightgrey',
                                borderRadius: '4px',
                                cursor: isDrawer ? 'crosshair' : 'not-allowed',
                                width: '100%',
                                height: 'auto'
                            }}
                        ></canvas>
                        {isDrawer && (
                            <button 
                                onClick={handleClearCanvas}
                                style={{
                                    marginTop: '10px',
                                    padding: '8px 16px',
                                    cursor: 'pointer'
                                }}>
                                    Clear Canvas
                            </button>
                        )}
                    </div>

                    <div style={{
                        backgroundColor: 'white',
                        padding: '15px',
                        borderRadius: '8px',
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <h4 style={{ marginTop: 0, color: 'black' }}> Chat and Guess Here!</h4>
                        <div style={{
                            flex: 1,
                            overflowY: 'scroll',
                            marginBottom: '10px',
                            backgroundColor: 'ghostwhite',
                            padding: '10px',
                            borderRadius: '4px'
                        }}>
                            {chatMessages.map((msg, idx) => (
                                <div 
                                    key={idx}
                                    style={{
                                        marginBottom: '5px',
                                        color: msg.username === 'SYSTEM' ? 'green' : 'black'
                                    }}>
                                        <strong>{msg.username}: </strong>{msg.message}
                                </div>
                            ))}
                        </div>
                        {!isDrawer && (
                            <form
                                onSubmit={handleGuessSubmit}
                                style={{
                                    display: 'flex',
                                    gap: '10px'
                                }}>
                                <input
                                    type="text"
                                    value={guessInput}
                                    onChange={(evt) => setGuessInput(evt.target.value)}
                                    placeholder='Type a message or enter your guess'
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid lightgrey'
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        padding: '8px 16px',
                                        cursor: 'pointer'
                                    }}>
                                        Send
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
            
            {showWordModal && isDrawer && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    left: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '12px',
                        minWidth: '400px'
                    }}>
                        <h2 style={{color: 'black'}}>Enter a Word to Draw</h2>
                        <form onSubmit={handleWordSubmit}>
                            <input
                                type="text"
                                value={wordInput}
                                onChange={(evt) => setWordInput(evt.target.value)}
                                placeholder='Enter a word'
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius:'4px',
                                    border: '2px solid lightgrey',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    marginTop: '15px',
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    backgroundColor: 'cornflowerblue',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px'
                                }}
                            >
                                Start Drawing
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {room?.status === 'finished' && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '50px',
                        borderRadius: '16px',
                        minWidth: '500px',
                    }}>
                        <h1 style={{
                            textAlign: 'center',
                            color: 'black',
                            marginBottom: '40px',
                            fontSize: '36px'
                        }}>
                            GAME OVER!
                        </h1>
                        <div style={{ marginBottom: '40px' }}>
                            {room.finalPlayers?.map((player, index) => {
                                let bgColor = 'whitesmoke';
                                let textColor = 'black';
                                if (index === 0) {
                                    bgColor = 'gold';
                                } else if (index === 1) {
                                    bgColor = 'silver';
                                } else if (index === 2) {
                                    bgColor = 'peru';
                                    textColor = 'white';
                                }

                                return (
                                    <div 
                                        key={index}
                                        style={{
                                            padding: '20px 25px',
                                            marginBottom: '12px',
                                            backgroundColor: bgColor,
                                            color: textColor,
                                            display: 'flex',
                                            borderRadius: '10px',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            fontSize: '20px',
                                            fontWeight: '600',
                                            border: player.userId === user._id ? '4px solid cornflowerblue' : 'none',
                                        }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '20px'
                                        }}>
                                            <span style={{ fontSize: '32px', minWidth: '40px'}}>{`${index + 1}.`}</span>
                                            <span style={{ fontSize: '22px' }}>{player.username}</span>
                            
                                        </div>
                                        <span style={{ fontSize: '24px', fontWeight: '700'}}>{player.score} pts</span>
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => navigate('/lobby')}
                            style={{
                                width: '100%',
                                padding: '18px',
                                fontSize: '20px',
                                fontWeight: '700',
                                cursor: 'poitner',
                                backgroundColor: 'cornflowerblue',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px'
                            }}>
                                Return to Lobby
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}