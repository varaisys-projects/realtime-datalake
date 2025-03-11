import React, { useEffect, useState, useCallback, useContext } from 'react'
import styles from './Destination.module.css'; // Correct import
// import Loader from '../../../components/Loader/Loader'
import { useParams } from 'react-router-dom'
import LongMenu from '../../../components/LongMenu/LongMenu'
import { JsonView, allExpanded, darkStyles, defaultStyles } from 'react-json-view-lite';
import Modal from "react-modal"
import ConfirmationModal from '../../../components/modals/ConfirmationModal/ConfirmationModal'
// import AlertModal from '../../../components/modals/AlertModal/AlertModal'
import { AppContext } from '../../../contexts/AppContext';

const Destination = ({ }) => {
  // const [loading, setLoading] = useState(false)
  const {setLoading, handleShowAlertModal, serverBaseURL} = useContext(AppContext)
  const [destinationsList, setDestinationsList] = useState([])
  const { id } = useParams();
  // const baseURL = "http://localhost:3002"
  const otherDetailOptions = ["View"]
  // const actionOptions = ["Create Pinot Destination"]
  const actionOptions = {
    "KAFKA": ["Create Pinot Destination", "Fetch Status", "Destroy"],
    "PINOT": ["Start Pinot", "Fetch Status", "Create Superset Destination", "Destroy"],
    "SUPERSET" : ["Destroy", "Fetch Status"], 
  }   
  const [showDetailsModalOpen, setShowDetailsModalOpen] = useState(false)
  const [modalContentToDisplay, setModalContentToDisplay] = useState("{}")
  const [confirmationPopupDetails, setConfirmationPopupDetails] = useState({
    showConfirmationPopup: false,
    confirmationMessgage: "",
    confirmationCallbackFunction: null
  })
  // const [showAlertModal, setShowAlertModal] = useState(false)
  // const [alertMessage, setAlertMessage] = useState("")

  // setShowConfirmationPopup(true);
  // setConfirmationMessage("Are u sure u want to start the connector")
  // setConfirmationFunctionToCall(handleCreatePinot)
  const showDetailsCustomStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: "90%",
      height: "90%",
      borderRadius: "10px",
      // zIndex: 1001  // ensure this is higher than other elements
    },
    overlay: {
      zIndex: 1000  // ensure this is higher than other elements but lower than content
    }
  };



  useEffect(() => {
    fetchDestinationsList()
  }, [])

  const fetchDestinationsList = async () => {
    try {
      setLoading(true)
      let response = await fetch(`${serverBaseURL}/destinations/fetch_destinations`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(id)
      })

      if (response.ok) {
        let data = await response.json();
        setDestinationsList(data.data)
        // console.log("list of destinations111111111111111111", data)
      } else {
        let error_data = await response.json();
        alert(error_data.message)
      }
    } catch (e) {
      console.log("error inside the fetchDestinationsList", e)
    } finally {
      setLoading(false)
    }
  }

  // const handleCloseAlertModal =  useCallback(() => {
  //   try{
  //     setShowAlertModal(false)
  //     setAlertMessage("")
  //   }catch(err){
  //     console.log("error inside the handleCloseAlertModal", err)
  //     setShowAlertModal(true)
  //     setAlertMessage("Something Went Wrong")
  //   }
  // }, [])
  

  const onDetailOptionClick = (clcikedOption, clickedListDestinationDetails) => {
    try {
      if (clcikedOption === "View") {
        handleViewOtherDetailClicked(clickedListDestinationDetails.other_details)
      }

      console.log("onMappingOptionClick clicked", clcikedOption)

    } catch (err) {
      console.log("error inside onMappingOptionClick ", err)
    }
  }

  const handleViewOtherDetailClicked = (other_details) => {
    try {
      // let formatedJson = JSON.stringify(JSON.parse(mappings), null, 2);
      // console.log("formatedJson", formatedJson)
      setModalContentToDisplay(other_details)
      setShowDetailsModalOpen(true)
    } catch (err) {
      console.log("error inside the handleViewMappingClicked",)
    }
  }


  const onActionOptionClick = (clcikedOption, clickedDestinationDetails) => {
    try {
      if (clcikedOption === "Create Pinot Destination") {
        setConfirmationPopupDetails({
          ...confirmationPopupDetails,
          confirmationCallbackFunction: () => { handleCreatePinot(clickedDestinationDetails) },
          confirmationMessgage: "Are u sure u want to create Pinot Destination",
          showConfirmationPopup: true,
        })
      } else if (clcikedOption === "Start Pinot") {
        setConfirmationPopupDetails({
          ...confirmationPopupDetails,
          confirmationCallbackFunction: () => { handleStartPinot(clickedDestinationDetails) },
          confirmationMessgage: "Are u sure u want to start Pinot ",
          showConfirmationPopup: true,
        })
      } else if(clcikedOption === "Create Superset Destination"){
        setConfirmationPopupDetails({
          ...confirmationPopupDetails,
          confirmationCallbackFunction: () => { handleCreateSupersetConnection(clickedDestinationDetails) },
          confirmationMessgage: "Are u sure u want to Create Superset Destination",
          showConfirmationPopup: true,
        })
      }
    } catch (err) {
      console.log("error inside onActionOptionClick ", err)
    }
  }

  const handleCreateSupersetConnection = async(clickedDestinationDetails)=>{
    try{
      setLoading(true)
      let destination_id = clickedDestinationDetails.id
      console.log("destination_id222222222222222222222222222", destination_id, clickedDestinationDetails)
      let response = await fetch(`${serverBaseURL}/destinations/superset/connect_superset`, {
        method:"POST",
        headers:{"Content-type": "application/json"},
        body:JSON.stringify(destination_id)
      })
      if (response.ok) {
        let data = await response.json()
        setConfirmationPopupDetails({
          ...ConfirmationModal,
          showConfirmationPopup: false,
          confirmationMessgage: "",
          confirmationCallbackFunction: null
        })
        fetchDestinationsList()
        console.log("data for create superset", data)
        //setShowAlertModal(true)
        handleShowAlertModal(data.message)
      } else {
        let error_data = await response.json()
        console.log(error_data)
        //setShowAlertModal(true)
        handleShowAlertModal(error_data.message)
      }
    }catch(err){
      console.log("erorr isnide handleCreateSupersetConnection", err)
    }finally{
      setLoading(false)
    }
  }

  const handleStartPinot = async (clickedDestinationDetails) => {
    try {
      setLoading(true)
      let destination_id = clickedDestinationDetails.id;
      let response = await fetch(`${serverBaseURL}/destinations/start_pinot`,
        {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: destination_id
        }
      )
      if (response.ok) {
        let data = await response.json()
        setConfirmationPopupDetails({
          ...ConfirmationModal,
          showConfirmationPopup: false,
          confirmationMessgage: "",
          confirmationCallbackFunction: null
        })
        fetchDestinationsList()
        console.log(data)
      } else {
        let error_data = await response.json()
        console.log(error_data)
        //setShowAlertModal(true)
        handleShowAlertModal(error_data.message)
      }
    } catch (err) {
      console.log("error inside the handleStartPinot", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePinot = async (clickedDestinationDetails) => {
    try {
      setLoading(true)
      let destination_id = clickedDestinationDetails.id;
      let response = await fetch(`${serverBaseURL}/destinations/create_pinot_destination`,
        {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: destination_id
        }
      )
      if (response.ok) {
        let data = await response.json()
        console.log(data)
        setConfirmationPopupDetails({
          ...ConfirmationModal,
          showConfirmationPopup: false,
          confirmationMessgage: "",
          confirmationCallbackFunction: null
        })
        fetchDestinationsList()
      } else {
        let error_data = await response.json()
        console.log(error_data)
        //setShowAlertModal(true)
        handleShowAlertModal(error_data.message)
      }
    } catch (err) {
      console.log("error inside the handleCreatePinot", err)
    } finally {
      setLoading(false)

    }
  }

  const handleCloseConfirmationModal = () => {
    try {
      setConfirmationPopupDetails({
        ...confirmationPopupDetails,
        showConfirmationPopup: false,
        confirmationMessgage: "",
        confirmationCallbackFunction: null
      })
    } catch (err) {
      console.log("error inside the handleCloseConfirmationModal", err)
    }
  }

  // const pinotExists = destinationsList.some(destination => destination.destination_type === "PINOT");

  const isOptionDisabled = (option, clickedListDetails) => {
    try{
      if (option === "Create Pinot Destination") {
        const pinotExists = destinationsList.some(destination => destination.destination_type === "PINOT");
        return pinotExists;
      }else if (option === "Destroy"){
        return true
      }else if(option === "Start Pinot"){
        // this is checking of any of the value inside schema nd table_created is fasle then keep this active...
        const table_details = JSON.parse(clickedListDetails.other_details).table_details
        const disable = !table_details.some(tableObject => tableObject.table_created === false || tableObject.schema_created === false);
        return disable
      }else if(option === "Create Superset Destination"){
        // this is checking if any superset destination already exist then keep this disable
        const supersetExists = destinationsList.some(destination => destination.destination_type === "SUPERSET");
        // const table_details = JSON.parse(clickedListDetails.other_details).table_details
        // const disable = table_details.some(tableObject => tableObject.table_created === false || tableObject.schema_created === false);
        // return supersetExists || disable
        return supersetExists 
      }
     return false;
    }
    catch(err){
      console.log("error inside the isOptionDisabled function", err)
    }
  };

  // console.log("destinationsList111111111111111111111111", destinationsList)
  return (
    <div className={styles.destination}>
      <h2>{"Destinations"}</h2>
      <div className={styles.table_container}>
        <table>
          <thead>
            <tr>
              <th>Destination ID</th>
              <th>Connection ID</th>
              <th>Destination Type</th>
              <th>Connection Status</th>
              <th>Connection Details</th>
              <th>Source ID</th>
              <th>Destination IDs</th>
              <th>Other Details</th>
              <th>Created at</th>
              <th>Updated at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {destinationsList.map((destinationItem) => (
              <tr key={destinationItem.id}>
                <td> {destinationItem.id}</td>
                <td>{destinationItem.conn_id}</td>
                <td>{destinationItem.destination_type}</td>
                <td>NA</td>
                <td>{destinationItem.connection_details}</td>
                <td>{destinationItem.source_ids}</td>
                <td>{destinationItem.dest_ids}</td>
                <td>
                  <div className={styles.other_details_container}>
                    {destinationItem.other_details.length > 50
                      ? destinationItem.other_details.slice(0, 50) + "..."
                      : destinationItem.other_details}
                    <LongMenu options={otherDetailOptions} onOptionClick={onDetailOptionClick} fullListDetails={destinationItem} />
                  </div>
                </td>
                <td>{destinationItem.created_at}</td>
                <td>{destinationItem.updated_at}</td>
                <td>
                  <LongMenu options={actionOptions[destinationItem.destination_type]} onOptionClick={onActionOptionClick} fullListDetails={destinationItem} isOptionDisabled = {isOptionDisabled}/>
                  {/* <button onClick={() => handleUpdateMappings(conn)}>Update Mappings</button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* <Loader loading={loading}></Loader> */}

      {/* {showDetailsModalOpen && */}
      <Modal
        isOpen={showDetailsModalOpen}
        // onRequestClose={handleCloseModal} 
        style={showDetailsCustomStyles}
      >
        <div className={styles.showDetailsModal}>
          <h3>Saved Details</h3>
          {/* {JSON.stringify(modalContentToDisplay, null, 2)} */}
          {/* <ReactJson src={JSON.parse(modalContentToDisplay)} theme="monokai" /> */}
          {/* <JSONTree data={JSON.parse(modalContentToDisplay)} /> */}
          <div className={styles.jsonView}>
            <JsonView data={JSON.parse(modalContentToDisplay)} shouldExpandNode={allExpanded} style={defaultStyles} />
          </div>
          <div className={styles.buttonContainer}>
            <button className="button" onClick={() => { setShowDetailsModalOpen(false) }}>Close</button>
          </div>
        </div>
      </Modal>
      {/* const ConfirmationModal = ({ showConfirmationModal, handleCloseConfirmationModal, confirmationMessage,functionTocallOnYesClicked,  yesButtonLabel = "Yes" }) => { */}

      <ConfirmationModal
        showConfirmationModal={confirmationPopupDetails.showConfirmationPopup}
        handleCloseConfirmationModal={handleCloseConfirmationModal}
        confirmationMessage={confirmationPopupDetails.confirmationMessgage}
        functionTocallOnYesClicked={confirmationPopupDetails.confirmationCallbackFunction}
      >
      </ConfirmationModal>

      {/* Alert modal */}
      {/* <AlertModal showAlertModal={showAlertModal} handleCloseAlertModal={handleCloseAlertModal} alertMessage={alertMessage}  ></AlertModal> */}
    </div>
  )

}

export default Destination