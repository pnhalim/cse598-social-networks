// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login.jsx";
import SetPassword from "./SetPassword.jsx";
import VerifyEmail from "./VerifyEmail.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/set-password/:token" element={<SetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}
