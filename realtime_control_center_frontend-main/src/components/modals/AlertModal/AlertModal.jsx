import React, { useContext, useEffect } from 'react'
import Modal from "react-modal"
import "./AlertModal.css"
import { AppContext } from '../../../contexts/AppContext';

const AlertModal = () => {

    const { showAlertModal, handleCloseAlertModal, alertMessage } = useContext(AppContext);
    useEffect(()=>{
        // console.log("alertMessage", alertMessage)
        // console.log("showAlertModal", showAlertModal)
    }, [])

    const handleCloseModal = () =>{
        handleCloseAlertModal()
    }

    const alertModalCustomStyles = {
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              transform: 'translate(-50%, -50%)',
              width: 'auto', // Adjust width based on content
            //   maxWidth: '90%', // Maximum width of the modal
            //   maxHeight: '80%', // Maximum height of the modal
              minWidth: "300px",
              minHeight : "200px",
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 0 15px rgba(0, 0, 0, 0.2)', // Optional: Add shadow for better visibility
              border: 'none', // Optional: Remove border if any
              overflow: 'auto', // Allow scrolling if content exceeds max height
            },
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
              zIndex: 1001, // Ensure this is below the content but higher than other elements
            },
    }


  return (
        <Modal
          isOpen={showAlertModal}
        //   onRequestClose={handleCloseModal} 
          style={alertModalCustomStyles}
        //   contentLabel="Example Modal"
        >
          <div className='alertModal'>
            <h2>Alert</h2>
            <p>{alertMessage}</p>
            {/* {JSON.stringify(modalContentToDisplay, null, 2)} */}
            {/* <ReactJson src={JSON.parse(modalContentToDisplay)} theme="monokai" /> */}
            {/* <JSONTree data={JSON.parse(modalContentToDisplay)} /> */}
            
            <div className='alertModalButtonsContainer'>
              {/* <button className="button" onClick={() => { handleConfirmationYesClicked()}}>YES</button> */}
              <button className="button" onClick={() => { handleCloseModal()}}>Close</button>
            </div>
          </div>
       </Modal>
  )
}

export default AlertModal
