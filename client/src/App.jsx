import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LobbyPage from './pages/LobbyPage';
import WaitingRoom from './pages/WaitingRoom';
import GamePage from './pages/GamePage';

//socket provider
import { SocketProvider } from './SocketContext';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path='/lobby' element={<LobbyPage />} />
          <Route path="/room/:roomCode" element={<WaitingRoom />} />
          <Route path="/game/:roomCode" element={<GamePage />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
