import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

//Set up and State
export default function LandingPage() {
    const [mode, setMode] = useState('login'); //mode toggles the form between the login and register
    const [username, setUsername] = useState(''); //username and pass hold form inputs
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); //holds error messages
    const [loading, setLoading] = useState(false); //true if a network request is in progress
    const navigate = useNavigate(); //this will redirect to /lobby after a successfuly login or register

    const handleSubmit = async(event) => {
        //prevent the default submit behavior, clear the errors, and set loading to true
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            //choose the end point of the request based on "mode"
            const endpoint = mode === 'login' ? '/login' : '/register';

            //here we use a relative url in production but the absolute one while were in development
            //YOUTUBE TUTORIAL USED FOR THIS PART OF CODE
            const baseURL = import.meta.env.MODE === 'production' ? import.meta.env.VITE_BACKEND_URL : 'http://localhost:3000';

            //fetch a post request 
            const response = await fetch(`${baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            //expects response in the form:
            // {user, success: true} if success 
            // {message, success: false} is failure
            if (data.success) {
                //save the users info to localStorage
                localStorage.setItem('user', JSON.stringify(data.user));

                //navigate to lobby/room selection
                navigate('/lobby');
            } else {
                setError(data.message);
            }
        } catch {
            setError('Connection error. Server may not be running');
        } finally {
            //no matter what, set loading back to false
            setLoading(false);
        }
    };

    //UI LAYOUT
    return (
        <div style = {{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '400px',
                margin: '0 auto'
            }}>
            {/* this is the title */}
                <h1 style={{
                    textAlign: 'center',
                    fontSize: '36px',
                    marginBottom: '10px',
                    color: 'black',
                }}>
                    🎨 Sketchy
                </h1>
                <p style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                    color: 'black'
                }}>
                    Draw, Guess, Win!
                </p>

                <div style={{
                    display: 'flex',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    padding: '4px'
                }}>
                    <button 
                        onClick={() => setMode('login')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: mode === 'login' ? 'cornflowerblue' : 'transparent',
                            color: mode === 'login' ? 'white' : 'grey'
                        }}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setMode('register')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: mode === 'register' ? 'cornflowerblue' : 'transparent',
                            color: mode === 'register' ? 'white' : 'grey'
                        }}>
                        Register
                    </button>
                </div>

                {/* now for the form */}
                <form onSubmit={handleSubmit}>
                    <div style={{marginBottom: '20px'}}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: 'grey'
                        }}>
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(evt => setUsername(evt.target.value))}
                            placeholder='Enter your username'
                            required
                            minLength={2}
                            maxLength={20}
                            style={{
                                width:'100%',
                                padding: '12px',
                                border: '2px solid black',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{marginBottom: '20px'}}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: 'grey'
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(evt => setPassword(evt.target.value))}
                            placeholder='Enter your password'
                            required
                            minLength={8}
                            style={{
                                width:'100%',
                                padding: '12px',
                                border: '2px solid black',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                        {mode === 'register' && (
                            <small style={{fontSize: '12px', marginTop: '4px', display: 'block', color: 'black'}}>
                                Password must be at least 8 characters
                            </small>
                        )}
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px',
                            fontSize: '14px',
                            marginBottom: '20px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            color: 'red',
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
                            {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
                    </button>
                </form>
            </div>
        </div>
    );
}


