import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {Login} from "./pages/Login/Login";
import {Register} from "./pages/Register/Register";
import {Profile} from "./pages/Profile/Profile";
import {StudentList} from "./components/StudentList/StudentList";
import {SchoolList} from "./components/SchoolList/SchoolList";
import {Navbar} from "./components/NavBar/NavBar"; // Asegúrate de tener un Navbar

function App() {
  return (
    <Router>
      <Navbar /> {/* Si tienes un Navbar, agrégalo aquí */}
      <Routes>
        <Route path="/" element={<Profile />} /> {/* Ruta inicial */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/students" element={<StudentList />} />
        <Route path="/schools" element={<SchoolList />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
