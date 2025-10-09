// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login.jsx";
import SetPassword from "./SetPassword.jsx";
import VerifyEmail from "./VerifyEmail.jsx";
import CompleteProfile from "./CompleteProfile.jsx";
import Profile from "./Profile.jsx";
import Home from "./Home.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/verify-email/:code" element={<VerifyEmail />} />
        <Route path="/set-password/:token" element={<SetPassword />} />
        <Route path="/complete-profile/:user_id" element={<CompleteProfile />} />
        <Route
           path="/profile"
           element={
             <ProtectedRoute>
               <Profile />
             </ProtectedRoute>
           }
         />
        <Route
           path="/home"
           element={
             <ProtectedRoute>
               <Home />
             </ProtectedRoute>
           }
         />
      </Routes>
    </BrowserRouter>
  );
}
