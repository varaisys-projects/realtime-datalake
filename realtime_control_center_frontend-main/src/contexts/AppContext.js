import React, { useCallback, useState } from "react";
import { createContext } from "react";

// this is the context created for the connection
export const AppContext = createContext()

// this is a componenet which takes a child component and return this child component by wrapping with the provider of context...
export const AppContextProvider = ({children}) => {

    const[loading, setLoading] = useState(false)
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const handleShowAlertModal = useCallback((message) => {
        setShowAlertModal(true);
        setAlertMessage(message);
    }, []);

    const handleCloseAlertModal = useCallback(() => {
        setShowAlertModal(false);
        setAlertMessage("");
    }, []);

    const serverBaseURL = "http://localhost:3002"


    let AppContextValues = {
        loading,
        setLoading,
        showAlertModal,
        setShowAlertModal,
        alertMessage, 
        setAlertMessage,
        handleShowAlertModal,
        handleCloseAlertModal,
        serverBaseURL
    }

    return (
        <AppContext.Provider value = {AppContextValues}>
            {children}
        </AppContext.Provider>
    )
}