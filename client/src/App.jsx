import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { AuthProvider } from './context/AuthContext';
import { TourFilterProvider } from './context/TourFilterContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import ChatbotWidget from './components/ChatbotWidget';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <TourFilterProvider>
            <RouterProvider router={router} />
            <ChatbotWidget />
          </TourFilterProvider>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
