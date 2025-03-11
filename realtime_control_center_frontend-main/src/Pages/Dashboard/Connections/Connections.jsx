// src/components/Connections.jsx
import React, { useEffect, useState, useCallback, useContext } from 'react';
import styles from './Connections.module.css';
import SchemaModal from '../../../components/SchemaModal/SchemaModal'; // Import the SchemaModal component
// import Loader from '../../../components/Loader/Loader';
import LongMenu from '../../../components/LongMenu/LongMenu';
import Modal from "react-modal"
// import ReactJson from 'react-json-view'; // Import react-json-view
import { JSONTree } from 'react-json-tree';
import { JsonView, allExpanded, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import DatabaseModal from '../../../components/DatabaseModal/DatabaseModal';
// import AlertModal from '../../../components/modals/AlertModal/AlertModal';
import { Link } from 'react-router-dom';
import { AppContext } from '../../../contexts/AppContext';


const Connections = () => {
  const [connectionDetailsList, setConnectionDetailsList] = useState([]); // list of all connections
  const [schemaModalOpen, setSchemaModalOpen] = useState(false); // 
  const [selectedConnection, setSelectedConnection] = useState(null); // connection on which we have clicked to update, delete etc
  const [schema, setSchema] = useState(null);  // schema fetched for the connection  details on which we have clicked from list
  const [checked, setChecked] = useState([]); // to store the checked boxes retrived from fetch call
  // const [loading, setLoading] = useState(false)
  const [selectedMappings, setSelectedMappings] = useState(null)
  const connectionDetailOptions = ["View"]
  const mappingDetailOptions = {
    "NA": ["Edit", "View"],
    "ACTIVE": ["View"]
  }
  const otherDetailOptions = ["View"]
  // const actionOptions = ["Start", "Pause", "Resume", "Stop", "Delete"]
  // const actionOptions = {
  //   "INACTIVE" : ["Start"],
  //   "RUNNING": ["Fetch Status", "Pause", "Restart", "Destroy Connector"],
  //   "PAUSED" : ["Fetch Status", "Resume", "Restart", "Destroy Connector"],
  //   "RESTARTING"	:  ["Fetch Status"],
  // }
  const actionOptions = {
    "NA": ["Start"],
    "ACTIVE": ["Start", "Fetch Status", "Pause", "Resume", "Restart", "Destroy Connector"],
    // "PAUSED" : ["Fetch Status", "Resume", "Restart", "Destroy Connector"],
    // "RESTARTING"	:  ["Fetch Status"],
  }
  const [showDetailsModalOpen, setShowDetailsModalOpen] = useState(false)
  const [modalContentToDisplay, setModalContentToDisplay] = useState("{}")
  const [credentialsModalOpen, setCredentialsModalOpen] = useState()
  const [confirmationMessage, setConfirmationMessage] = useState("")
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false)
  const [confirmationType, setConfirmationType] = useState(null)
  const [clickedListDetails, setClickedListDetails] = useState(null)

  // const [showAlertModal, setShowAlertModal] = useState(false)
  // const [alertMessage, setAlertMessage] = useState("")
  const {setLoading, handleShowAlertModal, serverBaseURL} = useContext(AppContext)
  // const baseURL = "http://localhost:3002"


  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true)
      // console.log("connection rendered1111111111111")
      let user = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(`${serverBaseURL}/connection/get_connections/${user.user_id}`);
      if (response.ok) {
        const data = await response.json()
        setConnectionDetailsList(data.connections);
      } else {
        const error_data = await response.json()
        console.log("data for connections list11111111111", error_data)
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false)
    }
  };

  const fetch_connection = async (connection_id) => {
    try {
      let response = await fetch(`${serverBaseURL}/connection/get_connection/${connection_id}`)
      if (response.ok) {
        let data = await response.json();
        return data.connection
      } else {
        let error_data = await response.json()
        //alert(error_data.message)
        //setShowAlertModal(true)
        handleShowAlertModal(error_data.message)
        console.log("error inside fetch_connection", error_data)
      }
    } catch (err) {
      console.log("error inside the fetch_Connection function", err)
    }
  }



  const handleUpdateMappings = (connection) => {
    // Fetch the schema and existing mappings for the selected connection
    const fetchSchema = async (connection) => {
      try {
        setLoading(true)
        let data = { connection_details: JSON.parse(connection.connection_details), selectedDatabaseType: connection.connection_type };
        // step 1: we know that we have connection detsils etc everything but we don't have schema etc so we need to fetch the schema to display that tree like structure.
        const response = await fetch(`${serverBaseURL}/connection/fetch_schema`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const data = await response.json();
          setSchema(data.schema);    // set the schema which we have received
          // setChecked(connection.checked_boxes);
          setSelectedConnection(connection);
          setSchemaModalOpen(true);
          setSelectedMappings(connection.mapping_details)
          // console.log("connection.checked_boxes inside connections", connection.checked_boxes)
        } else {
          const errorData = await response.json();
          console.error('Failed to fetch schema:', errorData);
          // alert(errorData.message);
          //setShowAlertModal(true)
          handleShowAlertModal("errorData.message")

        }
      } catch (err) {
        console.error('Error in fetchSchema function:', err);
        // alert('An error occurred while fetching schema. Please try again later.');
        //setShowAlertModal(true)
        handleShowAlertModal("An error occurred while fetching schema. Please try again later.")
      } finally {
        setLoading(false)
      }
    };

    fetchSchema(connection);
  };

  const handleSaveSchema = useCallback(
    async (mappings_details, checked_boxes) => {
    try {
      console.log("triggered`111111111111111111111111")

      setLoading(true)
      let user = JSON.parse(localStorage.getItem("user"));
      let data = {
        user_id: user.user_id,
        connection_id: selectedConnection.id, // Use the connection ID to identify which connection to update
        mappings_details: mappings_details,
        checked_boxes: checked_boxes,
        connection_details: selectedConnection.connection_details
      };
      console.log("data111111111111111111", data)
      let response = await fetch(`${serverBaseURL}/connection/update_mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        let data = await response.json();
        // alert(data.message);
        //setShowAlertModal(true)
        handleShowAlertModal(data.message)
        setSchemaModalOpen(false); // Close the modal after successful save
        setSchema(null)

        let fetched_connection = await fetch_connection(selectedConnection.id)
        if (!fetched_connection) {
          // alert("issue in updating, please refsetAlertMessageeresh the page and try again")
          //setShowAlertModal(true)
          handleShowAlertModal("issue in updating, please refsetAlertMessageeresh the page and try again")
          console.log("fetched connection is null inside handleSaveSchema")
          return
        }

        // Update the connection details with the new mappings
        // setConnectionDetailsList(prevDetails =>
        //   prevDetails.map(conn =>
        //     conn.id === selectedConnection.id
        //       ? { ...conn, mapping_details: JSON.stringify(mappings_details), checked_boxes: checked_boxes }
        //       : conn
        //   )
        // );

        setConnectionDetailsList(prevDetails =>
          prevDetails.map(conn =>
            conn.id === selectedConnection.id
              ? fetched_connection
              : conn
          )
        );

      } else {
        let error_data = await response.json();
        // alert(error_data.message);
        //setShowAlertModal(true)
        handleShowAlertModal(error_data.message)
      }
    } catch (err) {
      console.error('Error in handleSaveSchema function:', err);
      // alert('An error occurred while updating the mappings. Please try again later.');
      //setShowAlertModal(true)
      handleShowAlertModal("An error occurred while updating the mappings. Please try again later.")
    } finally {
      setLoading(false)
    }
  },[selectedConnection, fetch_connection] )





  const handleSchemaModalClose = useCallback(() => {
    try {
      setSchemaModalOpen(false)
      setSchema(null)
    } catch (err) {
      console.log("erorr inside the handleSchemaModalClose", err)
    }
  },[])

  const onConnectionOptionClick = (clcikedOption, clickedListConnectionDetails) => {
    try {
      if (clcikedOption === "Edit") {
        handleConnectionUpdate(clickedListConnectionDetails)

      } else if (clcikedOption === "View") {
        handleViewConnectionClicked(clickedListConnectionDetails.connection_details)
      }
      // console.log("onConnectionOptionClick clicked", clcikedOption)
    } catch (err) {
      console.log("error inside onConnectionOptionClick ", err)
    }
  }

  const handleViewMappingClicked = (mappings) => {
    try {
      // let formatedJson = JSON.stringify(JSON.parse(mappings), null, 2);
      // console.log("formatedJson", formatedJson)
      setModalContentToDisplay(mappings)
      setShowDetailsModalOpen(true)
    } catch (err) {
      console.log("error inside the handleViewMappingClicked",)
    }
  }

  const handleViewConnectionClicked = (connection_details) => {
    try {
      setModalContentToDisplay(connection_details)
      setShowDetailsModalOpen(true)
    } catch (err) {
      console.log("error inside the handleViewConnectionClicked",)
    }
  }


  const onMappingOptionClick = (clcikedOption, clickedListConnectionDetails) => {
    try {
      if (clcikedOption === "Edit") {
        handleUpdateMappings(clickedListConnectionDetails)
      } else if (clcikedOption === "View") {
        handleViewMappingClicked(clickedListConnectionDetails.mapping_details)
      }

      console.log("onMappingOptionClick clicked", clcikedOption)

    } catch (err) {
      console.log("error inside onMappingOptionClick ", err)
    }
  }


  // it will get ytriggered whenever any of the options inside the otherdeatils is clicked
  // this function first paramtere will get the clciked option and second is connectiondeatils
  const onDetailOptionClick = (clcikedOption, clickedListConnectionDetails) => {
    try {
      if (clcikedOption === "View") {
        handleViewOtherDetailClicked(clickedListConnectionDetails.other_details)
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

  const onActionOptionClick = (clcikedOption, clickedListConnectionDetails) => {
    try {
      if (clcikedOption === "Start") {
        setShowConfirmationPopup(true);
        setConfirmationMessage("Are u sure u want to start the connector")
        setConfirmationType("start_connector")
        setClickedListDetails(clickedListConnectionDetails)
        // handleStartClicked(clickedListConnectionDetails)

      } else if (clcikedOption === "Fetch Status") {
        handleFetchConnectorStatusClicked(clickedListConnectionDetails)

      } else if (clcikedOption === "Pause") {
        setShowConfirmationPopup(true);
        setConfirmationMessage("Are u sure u want to Pause the connector")
        setConfirmationType("pause_connector")
        setClickedListDetails(clickedListConnectionDetails)

        // handlePauseClicked(clickedListConnectionDetails)

      } else if (clcikedOption === "Resume") {
        setShowConfirmationPopup(true);
        setConfirmationMessage("Are u sure u want to Resume the connector")
        setConfirmationType("resume_connector")
        setClickedListDetails(clickedListConnectionDetails)

        // handleResumeClicked(clickedListConnectionDetails)

      } else if (clcikedOption === "Restart") {
        setShowConfirmationPopup(true);
        setConfirmationMessage("Are u sure u want to Restart the connector")
        setConfirmationType("restart_connector")
        setClickedListDetails(clickedListConnectionDetails)

        // handleRestartClicked(clickedListConnectionDetails)

      } else if (clcikedOption === "Destroy Connector") {
        setShowConfirmationPopup(true);
        setConfirmationMessage("Are u sure u want to Destroy the connector")
        setConfirmationType("destroy_connector")
        setClickedListDetails(clickedListConnectionDetails)

        // handleDestroyConnectorClicked(clickedListConnectionDetails)
      }

      // if (clcikedOption === "Start") {
      //   handleStartClicked(clickedListConnectionDetails)
      // } else if (clcikedOption === "Fetch Status") {
      //   handleStopClicked(clickedListConnectionDetails)
      // } else if (clcikedOption === "Pause"){
      //   handlePauseClicked(clickedListConnectionDetails)
      // } else if (clcikedOption === "Resume"){
      //   handleResumeClicked(clickedListConnectionDetails)handleStartClicked
      // } else if (clcikedOption === ""){
      //   handleDeleteClicked(clickedListConnectionDetails)
      // }
      // console.log("onMappingOptionClick clicked", clcikedOption)
    } catch (err) {
      console.log("error inside onActionOptionClick ", err)
    }
  }

  const handleFetchConnectorStatusClicked = async (clickedListConnectionDetails) => {
    try {
      setLoading(true)
      let connector_name = JSON.parse(clickedListConnectionDetails.other_details).kafka_connect_details.name
      let connection_id = clickedListConnectionDetails["id"]
      let response = await fetch(`${serverBaseURL}/kafka_connect/fetch_connector_status`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ connector_name, connection_id })
      })

      // this if else both runs when the api hit is successfull but there were some issue like data sent is wrong etc anything else
      if (response.ok) {

        let data = await response.json()
        console.log("handleFetchConnectorStatusClicked api data", data)
        // //alert(data.message)
        //setShowAlertModal(true)
        handleShowAlertModal(data.message)
        let newUpdatedList = connectionDetailsList.map((item) => {
          if (item.id === clickedListConnectionDetails.id) {
            return { ...item, connector_status: data.connector_status }
          } else {
            return { ...item }
          }
        })
        setConnectionDetailsList(newUpdatedList)
      } else {
        // console.log("triggered44444444.1")
        let error_data = await response.json()
        console.log("handleFetchConnectorStatusClicked api error_data", error_data)
        //alert(error_data.message)
        //setShowAlertModal(true)
        handleShowAlertModal(JSON.parse(error_data.message).message)
      }
    } catch (err) {
      //alert("Something went wrong, Please try again later")
      //setShowAlertModal(true)
      handleShowAlertModal("Something went wrong, Please try again later")
      console.log("error inside the handleFetchConnectorStatusClicked", err)
    } finally {
      setLoading(false)
    }
  }




  const handleRestartClicked = async (clickedListConnectionDetails) => {
    try {
      setLoading(true)
      let connector_name = JSON.parse(clickedListConnectionDetails.other_details).kafka_connect_details.name
      let connection_id = clickedListConnectionDetails["id"]
      let response = await fetch(`${serverBaseURL}/kafka_connect/restart_connection`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ connector_name, connection_id })
      })

      // this if else both runs when the api hit is successfull but there were some issue like data sent is wrong etc anything else
      if (response.ok) {
        let data = await response.json()
        //alert(data.message)
        // //setShowAlertModal(true)
        // handleShowAlertModal(data.message)
        console.log("handleRestartClicked api data", data)
      } else {
        let error_data = await response.json()
        //alert(error_data.message)
        //setShowAlertModal(true)
        handleShowAlertModal(JSON.parse(error_data.message).message)
        console.log("handleRestartClicked api error_data", error_data)

      }
    } catch (err) {
      //alert("Something went wrong, Please try again later")
      //setShowAlertModal(true)
      handleShowAlertModal("Something went wrong, Please try again later")
      console.log("error inside the handleRestartClicked", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDestroyConnectorClicked = async (clickedListConnectionDetails) => {
    try {
      setLoading(true)
      let connector_name = JSON.parse(clickedListConnectionDetails.other_details).kafka_connect_details.name
      let connection_id = clickedListConnectionDetails["id"]
      let response = await fetch(`${serverBaseURL}/kafka_connect/destroy_connector`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ connector_name, connection_id })
      })

      // this if else both runs when the api hit is successfull but there were some issue like data sent is wrong etc anything else
      if (response.ok) {

        let data = await response.json()
        console.log("handleDestroyConnectorClicked api data", data)
        //alert(data.message)
        //setShowAlertModal(true)
        handleShowAlertModal(data.message)
        let newUpdatedList = connectionDetailsList.map((item) => {
          if (item.id === clickedListConnectionDetails.id) {
            return { ...item, connector_status: data.connector_status }
          } else {
            return { ...item }
          }
        })
        setConnectionDetailsList(newUpdatedList)
      } else {
        console.log("triggered44444444.1")
        let error_data = await response.json()
        console.log("triggered44444444.2")
        console.log("handleDestroyConnectorClicked api error_data", error_data)
        //alert(error_data.message)
        //setShowAlertModal(true)
        handleShowAlertModal(error_data.message)
      }
    } catch (err) {
      //alert("Something went wrong, Please try again later")
      //setShowAlertModal(true)
      handleShowAlertModal("Something went wrong, Please try again later")
      console.log("error inside the handleDestroyConnectorClicked", err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectionUpdate = (clickedListConnectionDetails) => {
    try {
      setSelectedConnection(clickedListConnectionDetails)
      setCredentialsModalOpen(true)
    } catch (err) {
      console.log("error inside handleConnectionUpdate fuction", handleConnectionUpdate)
    }
  }

  const handleStartClicked = async (clickedListConnectionDetails) => {
    try {
      setLoading(true)
      let other_details = JSON.parse(clickedListConnectionDetails.other_details)
      console.log("otherDetails", other_details)
      let kafka_connect_details = other_details.kafka_connect_details;
      let resposne = await fetch(`${serverBaseURL}/kafka_connect/start_connection`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(clickedListConnectionDetails)
      })
      if (resposne.ok) {
        let data = await resposne.json()
        console.log("data of handleActvateClick", data)
        let newUpdatedList = connectionDetailsList.map((item) => {
          if (item.id === clickedListConnectionDetails.id) {
            return { ...item, overall_status: data.overall_status, connector_status: data.connector_status }
          } else {
            return { ...item }
          }
        })
        setConnectionDetailsList(newUpdatedList)
        //alert("connector created successfully")
        // //setShowAlertModal(true)
        // handleShowAlertModal("connector created successfully")
      } else {
        let error_data = await resposne.json();
        //setShowAlertModal(true)
        handleShowAlertModal(error_data.data.message)
        // switch (error_data.data.error_code){
        //   case 409:
        //     //alert("Error: The connector already exists. Please use a different name or check the existing connectors.");
        //     //setShowAlertModal(true)
        //     handleShowAlertModal("Error: The connector already exists. Please use a different name or check the existing connectors.")
        //     break;
        //   case 400:
        //     //alert("Error: Bad request. Please check the data you have sent.");
        //     //setShowAlertModal(true)
        //     handleShowAlertModal("Error: Bad request. Please check the data you have sent.")
        //     break;
        //   case 500:
        //     //alert("Error: Server issue. Please try again later.");
        //     //setShowAlertModal(true)
        //     handleShowAlertModal("Error: Server issue. Please try again later.")
        //     break;
        //   default:
        //     console.log("Error inside handleStartClicked", error_data.data)
        //     //alert("Something went wrong, Please Referesh the page and try again");
        //     //setShowAlertModal(true)
        //     handleShowAlertModal("Error inside handleStartClicked", error_data.data)
        // }
      }
    } catch (err) {
      //alert("Something went wrong, Please try again later")
      //setShowAlertModal(true)
      handleShowAlertModal("Something went wrong, Please try again later")
      console.log("Error in handleActivateClicked:", err);
    } finally {
      setLoading(false)
    }
  }




  const handleStopClicked = (clickedListConnectionDetails) => {
    try {
      console.log("stop clicked for:", clickedListConnectionDetails);
      // data = 

    } catch (err) {
      console.log("Error in handleStopClicked:", err);
    }
  }

  const handlePauseClicked = async (clickedListConnectionDetails) => {
    try {
      setLoading(true)
      let connector_name = JSON.parse(clickedListConnectionDetails.other_details).kafka_connect_details.name
      let connection_id = clickedListConnectionDetails["id"]
      let response = await fetch(`${serverBaseURL}/kafka_connect/pause_connection`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ connector_name, connection_id })
      })

      // this if else both runs when the api hit is successfull but there were some issue like data sent is wrong etc anything else
      if (response.ok) {
        let data = await response.json()
        //alert(data.message)
        // //setShowAlertModal(true)
        // handleShowAlertModal(data.message)
        console.log("handlePauseClicked api data", data)
        let newUpdatedList = connectionDetailsList.map((item) => {
          if (item.id === clickedListConnectionDetails.id) {
            return { ...item, connector_status: data.connector_status }
          } else {
            return { ...item }
          }
        })
        setConnectionDetailsList(newUpdatedList)
      } else {
        let error_data = await response.json()
        //alert(error_data.message)
        //setShowAlertModal(true)
        handleShowAlertModal(JSON.parse(error_data.message).message)
        console.log("handlePauseClicked api error_data", error_data)
      }

    } catch (err) {
      console.log("Error in handlePauseClicked:", err);
    } finally {
      setLoading(false)
    }
  }

  const handleResumeClicked = async (clickedListConnectionDetails) => {
    try {
      setLoading(true)
      let connector_name = JSON.parse(clickedListConnectionDetails.other_details).kafka_connect_details.name
      let connection_id = clickedListConnectionDetails["id"]

      let response = await fetch(`${serverBaseURL}/kafka_connect/resume_connection`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ connector_name, connection_id })
      })

      // this if else both runs when the api hit is successfull but there were some issue like data sent is wrong etc anything else
      if (response.ok) {
        let data = await response.json()
        //alert(data.message)
        // //setShowAlertModal(true)
        // handleShowAlertModal(data.message)
        console.log("handleResumeClicked api data", data)
        let newUpdatedList = connectionDetailsList.map((item) => {
          if (item.id === clickedListConnectionDetails.id) {
            return { ...item, connector_status: data.connector_status }
          } else {
            return { ...item }
          }
        })
        setConnectionDetailsList(newUpdatedList)
      } else {
        let error_data = await response.json()
        //alert(error_data.message)
        //setShowAlertModal(true)
        handleShowAlertModal(JSON.parse(error_data.message).message)
        console.log("handleResumeClicked api error_data", error_data)
      }
    } catch (err) {
      console.log("Error in handleResumeClicked:", err);
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClicked = async (clickedListConnectionDetails) => {
    try {
      console.log("handleDeleteClicked clicked for:", clickedListConnectionDetails);
      let data = { user_id: clickedListConnectionDetails.user_id, connection_id: clickedListConnectionDetails.id }
      console.log("data", data)
      let response = await fetch(`${serverBaseURL}/connection/delete_connection`, {
        method: "POST",
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify(data)
      })
      // let response = await fetch(`${serverBaseURL}/connection/update_mapping`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(data)
      // });

      if (response.ok) {
        let data = await response.json();
        //alert(data.message)
        //setShowAlertModal(true)
        handleShowAlertModal(data.message)
        console.log("Delete respose data", data)
        let filteredList = connectionDetailsList.filter((connection) => {
          return connection.id !== clickedListConnectionDetails.id
        })
        setConnectionDetailsList(filteredList)
      } else {
        let errorData = await response.json();
        console.log("errorData", errorData)
      }
    } catch (err) {
      console.log("Error in handleDeleteClicked:", err);
    }
  }



  const customStyles = {
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

  // const confirmationModalCustomStyles = {
  //   content: {
  //     top: '50%',
  //     left: '50%',
  //     right: 'auto',
  //     bottom: 'auto',
  //     marginRight: '-50%',
  //     transform: 'translate(-50%, -50%)',
  //     width: "50%",
  //     height: "50%",
  //     borderRadius: "10px",
  //     // zIndex: 1001  // ensure this is higher than other elements
  //   },
  //   overlay: {
  //     zIndex: 1000  // ensure this is higher than other elements but lower than content
  //   }
  // }

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


  const handleCloseCredentialsModal = useCallback(() => {
    try {
      setCredentialsModalOpen(false)
      console.log("handleCloseCredentialsModal triggered ")
    } catch (err) {
      console.log("error inside handleCloseCredentialsModal", err)
    }
  }, [])

  // const actionOptions = () =>{

  // }


  const handleConfirmationYesClicked = () => {
    try {
      switch (confirmationType) {
        case "start_connector":
          handleStartClicked(clickedListDetails)
          setShowConfirmationPopup(false)
          break;
        case "restart_connector":
          handleRestartClicked(clickedListDetails)
          setShowConfirmationPopup(false)

          break;
        case "pause_connector":
          handlePauseClicked(clickedListDetails)
          setShowConfirmationPopup(false)

          break;
        case "resume_connector":
          handleResumeClicked(clickedListDetails)
          setShowConfirmationPopup(false)

          break;
        default:
          console.log('Unknown confirmation type');
      }
    } catch (err) {
      console.log("error inside handleConfirmationYesClicked", err)
    }
  }

  // const handleCloseAlertModal = useCallback(() => {
  //   try {
  //     //setShowAlertModal(false)
  //     setAlertMessage("")
  //   } catch (err) {
  //     //setShowAlertModal(true)
  //     setAlertMessage("Something went wrong inside handleCloseAlertModal", err)
  //     console.log("error inside the handleCloseAlertModal", err)
  //   }
  // }, [])


  
  const isOptionDisabled = (option, clickedListDetails) => {
    try{
      if (option === "Start") {
        if (clickedListDetails.overall_status === "ACTIVE"){
          return true
        }
      }else if(option === "Fetch Status" || option === "Pause" || option === "Resume" || option === "Restart" || option === "Destroy Connector"){
        if(clickedListDetails.overall_status === "NA"){
          return true
        }
      }
     // Add other conditions as needed
     return false;
    }
    catch(err){
      console.log("error inside the isOptionDisabled function", err)
    }
  };


  return (
    <div className={styles.connections}>
      <h2>Your Connections</h2>
      <div className={styles.table_container}>
        <table>
          <thead>
            <tr>
              <th>Connection ID</th>
              <th>Connection Type</th>
              <th>Connector Status</th>
              <th>Overall status</th>
              <th>Connection Details</th>
              <th>Mapping Details</th>
              <th>Other Details</th>
              <th>Created at</th>
              <th>Updated at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {connectionDetailsList.slice().reverse().map((conn) => (
              <tr key={conn.id}>
                <td> {conn.overall_status == "ACTIVE" ?
                  (<Link to={`/dashboard/destinations/${conn.id}`} >
                    <span>{conn.id}</span>
                  </Link>) : conn.id}
                </td>
                <td>{conn.connection_type}</td>
                <td>{conn.connector_status}</td>
                <td>{conn.overall_status}</td>
                <td>
                  <div className={styles.connection_details_container}>
                    {conn.connection_details.length > 50
                      ? conn.connection_details.slice(0, 50) + "..."
                      : conn.connection_details}
                    {/* one way is pass the connectio to longMenue as a prop and  while clcik pass that as second parameter 
                      second way : while clicking on the menue save the clicked menue connection details  */}
                    <LongMenu options={connectionDetailOptions} onOptionClick={onConnectionOptionClick} fullListDetails={conn} />
                  </div>
                </td>
                <td>
                  <div className= {styles.mapping_details_container}>
                    {conn.mapping_details.length > 50
                      ? conn.mapping_details.slice(0, 50) + "..."
                      : conn.mapping_details}
                    <LongMenu options={mappingDetailOptions[conn.overall_status]} onOptionClick={onMappingOptionClick} fullListDetails={conn} />
                  </div>
                </td>
                <td>
                  <div className={styles.other_details_container}>
                    {conn.other_details.length > 50
                      ? conn.other_details.slice(0, 50) + "..."
                      : conn.other_details}
                    <LongMenu options={otherDetailOptions} onOptionClick={onDetailOptionClick} fullListDetails={conn} />
                  </div>
                </td>
                <td>{conn.created_at}</td>
                <td>{conn.updated_at}</td>
                <td>
                  <LongMenu options={actionOptions["ACTIVE"]} onOptionClick={onActionOptionClick} fullListDetails={conn} isOptionDisabled = {isOptionDisabled} />
                  {/* <button onClick={() => handleUpdateMappings(conn)}>Update Mappings</button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {schema &&
        <SchemaModal
          schemaModalOpen={schemaModalOpen}
          handleSchemaModalClose={handleSchemaModalClose}
          schema={schema}
          handleSaveSchema={handleSaveSchema}
          initiallyChecked={checked}
          setChecked={setChecked}
          actionType={"update"}
          initialMappings={JSON.parse(selectedMappings)}
        />
      }

      {/* modal to display the view details */}
      {/* {showDetailsModalOpen && */}
      <Modal
        isOpen={showDetailsModalOpen}
        // onRequestClose={handleCloseModal} 
        style={customStyles}
        contentLabel="Example Modal"
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
      {/* confirmation model */}
      <Modal
        isOpen={showConfirmationPopup}
        // onRequestClose={handleCloseModal} 
        style={confirmationModalCustomStyles}
        contentLabel="Example Modal"
      >
        <div className={styles.confirmationModal}>
          <h2>Are u Sure ?</h2>
          <h6>{confirmationMessage}</h6>
          {/* {JSON.stringify(modalContentToDisplay, null, 2)} */}
          {/* <ReactJson src={JSON.parse(modalContentToDisplay)} theme="monokai" /> */}
          {/* <JSONTree data={JSON.parse(modalContentToDisplay)} /> */}

          <div className={styles.confirmationButtonsContainer}>
            <button className="button" onClick={() => { handleConfirmationYesClicked() }}>YES</button>
            <button className="button" onClick={() => { setShowConfirmationPopup(false) }}>Close</button>
          </div>
        </div>
      </Modal>

      {/*component to show connection details*/}

      {/* Only render DatabaseModal if selectedConnection is not null */}
      {selectedConnection && (
        <DatabaseModal
          credentialsModalOpen={credentialsModalOpen}
          handleCloseCredentialsModal={handleCloseCredentialsModal}
          sourceDatabaseType={selectedConnection.connection_type}
          InitialConnectionFullDetails={selectedConnection}
        />
      )}

      {/* <Loader loading={loading}></Loader> */}
      {/* alert Moal */}
      {
        // <AlertModal showAlertModal={showAlertModal} handleCloseAlertModal={handleCloseAlertModal} alertMessage={alertMessage}  ></AlertModal>
      }
    </div>
  );
};

export default Connections;