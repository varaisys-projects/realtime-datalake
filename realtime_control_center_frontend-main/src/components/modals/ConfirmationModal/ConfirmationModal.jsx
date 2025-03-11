import React from "react";
import Modal from "react-modal"
import "./ConfirmationModal.css"

const ConfirmationModal = ({ showConfirmationModal, handleCloseConfirmationModal, confirmationMessage,functionTocallOnYesClicked,  yesButtonLabel = "Yes" }) => {

    const confirmationModalCustomStyles = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
            width: 'auto', // Adjust width based on content
            maxWidth: '90%', // Maximum width of the modal
            maxHeight: '80%', // Maximum height of the modal
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 0 15px rgba(0, 0, 0, 0.2)', // Optional: Add shadow for better visibility
            border: 'none', // Optional: Remove border if any
            overflow: 'auto', // Allow scrolling if content exceeds max height
        },
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
            zIndex: 1000, // Ensure this is below the content but higher than other elements
        },
    };

    const  handleCloseModal = ()=>{
        try{
            handleCloseConfirmationModal()
        }catch(err){
            console.log("err inside handleCloseConfirmationPopup", err)
        }
    }

    const handleConfirmationYesClicked = () =>{
        try{
            console.log("functionTocallOnYesClicked", functionTocallOnYesClicked)
            functionTocallOnYesClicked()
        }catch(err){
            console.log("error inside handleConfirmationYesClicked", err)
            alert("Something went wrong")
        }
    }


    return (
        <Modal
            isOpen={showConfirmationModal}
            style={confirmationModalCustomStyles}

        >
            <div className='confirmationModal'>
                <h2>Are u Sure ?</h2>
                <h6>{confirmationMessage}</h6>
                {/* {JSON.stringify(modalContentToDisplay, null, 2)} */}
                {/* <ReactJson src={JSON.parse(modalContentToDisplay)} theme="monokai" /> */}
                {/* <JSONTree data={JSON.parse(modalContentToDisplay)} /> */}

                <div className='confirmationButtonsContainer'>
                    <button className="button" onClick={() => { handleConfirmationYesClicked() }}>{yesButtonLabel}</button>
                    <button className="button" onClick={() => { handleCloseModal() }}>Close</button>
                </div>
            </div>
        </Modal>
    )
}


export default ConfirmationModal