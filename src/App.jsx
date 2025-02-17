import { AuthProvider, useAuth } from './contexts/AuthContext';
import ChatInterface from './components/ChatInterface';
import LoginPage from './components/LoginPage';

const ProtectedApp = () => {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return <ChatInterface />;
};

function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}

export default App;
