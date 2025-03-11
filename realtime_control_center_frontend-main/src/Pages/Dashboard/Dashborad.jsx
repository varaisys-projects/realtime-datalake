
import React, { useEffect, createContext } from "react";
import Sidebar1 from "../../components/Sidebar/Sidebar1";
import { Routes, Route } from "react-router-dom";
import Destination from "./Desitnations/Destination";
import "./Dashboard.css"
import Builder from "./Builder/Builder";
import Settings from "./Settings/Settings";
import { useNavigate, useLocation } from 'react-router-dom';
import Sources from "./Sources/Sources";
import Connections from "./Connections/Connections";
import { ConnectionContextProvided } from "../../contexts/ConnectionContext";

const Dashborad = () => {
  const navigate = useNavigate()
  // const location = useLocation();


  //   useEffect(() => {
  //     const handleBackButton = (event) => {
  //         // Check if the current path is not the dashboard
  //         if (location.pathname === '/login') {
  //             // Redirect to '/dashboard' and replace the history entry
  //             navigate('/dashboard', { replace: true });
  //         }
  //     };

  //     // Add event listener for popstate event (triggered by back/forward navigation)
  //     window.addEventListener('popstate', handleBackButton);

  //     // Cleanup the event listener on component unmount
  //     return () => {
  //         window.removeEventListener('popstate', handleBackButton);
  //     };
  // }, [navigate, location.pathname]); // Dependencies ensure effect runs on navigate or path change

  return (
    <div className="dashboard" >
      <Sidebar1></Sidebar1>
      {/* <Connections></Connections> */}
      <div className="content-area">
        <Routes>
          <Route path="/Sources" element={<Sources></Sources>}></Route>
          <Route path="/destinations/:id" element={<Destination></Destination>}></Route>
          <Route path="/connections" element={
            <ConnectionContextProvided>
              <Connections />
            </ConnectionContextProvided>}>
          </Route>
          <Route path="/builder" element={<Builder></Builder>}></Route>
          <Route path="/settings" element={<Settings></Settings>}></Route>
        </Routes>
      </div>
      {/* <button onClick={()=>{navigate("./login")}}>navigte login</button> */}
    </div>
  );
};

export default Dashborad;