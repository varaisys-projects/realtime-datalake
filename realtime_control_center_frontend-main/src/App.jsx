import Dashborad from "./Pages/Dashboard/Dashborad";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./Pages/Signup/Signup";
import Login from "./Pages/Login/Login";
import "./global.css"
import DatabaseModal from "./components/DatabaseModal/DatabaseModal";
import Loader from "./components/Loader/Loader";
import AlertModal from "./components/modals/AlertModal/AlertModal";

function App() {
  return (
    // <div>
    //   <DatabaseModal></DatabaseModal>
    // </div>
    <>
    <BrowserRouter>
    <Routes>
      <Route path="/dashboard/*" element={<Dashborad></Dashborad>}></Route>
      <Route path="/signup" element={<Signup></Signup>}></Route>
      <Route path="/login" element={<Login></Login>}></Route>
    </Routes>
    </BrowserRouter>

{/* Global components */}
    <Loader />
    <AlertModal/>
    </>

    // loader
  );
}

export default App;