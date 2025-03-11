import React, { useCallback, useContext, useEffect, useState } from 'react'
import Modal from "react-modal"
import "./DatabaseModal.css"
// import Loader from '../Loader/Loader';
import SchemaModal from '../SchemaModal/SchemaModal';
// import AlertModal from '../modals/AlertModal/AlertModal';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../contexts/AppContext';

Modal.setAppElement('#root');

const DatabaseModal = ({credentialsModalOpen, handleCloseCredentialsModal, sourceDatabaseType="Source Database Type",  InitialConnectionFullDetails}) => {

const navigate = useNavigate()

const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      minWidth:"50%",
      borderRadius:"10px"
    },
    overlay: {
      zIndex: 999  // ensure this is higher than other elements but lower than content
    }
  };

  const [host, setHost] = useState('192.168.29.143');
  const [port, setPort] = useState('3306');
  const [username, setUsername] = useState('debezium');
  const [password, setPassword] = useState('dbz');
  const [databaseName, setDatabaseName] = useState('inventory');
  // const [loading, setLoading] = useState(false)
  const [connectionDetails, setConnectionDetails] = useState("")
  const [schemaModalOpen, setSchemaModalOpen] = useState(false)
  const [schema, setSchema] = useState(null)
  const [mapping, setMapping] = useState(null)
  // const [showAlertModal, setShowAlertModal] = useState(false)
  // const [alertMessage, setAlertMessage] = useState("")
  const {setLoading, handleShowAlertModal, serverBaseURL} = useContext(AppContext)

  useEffect(() => {
    try{
      // console.log("triggered databseModal useEffect initial1111111111 InitialConnectionFullDetails", InitialConnectionFullDetails)
      if (InitialConnectionFullDetails) {
        let connection_details = JSON.parse(InitialConnectionFullDetails.connection_details)
        setHost(connection_details.host );
        setPort(connection_details.port );
        setUsername(connection_details.username );
        setPassword(connectionDetails.password );
        setDatabaseName(connection_details.databaseName );
      }
    }catch(err){
      console.log("error inside useEffect of DatabaseModal", err)
    }
  
  }, [InitialConnectionFullDetails, credentialsModalOpen]);


 const handleCreate =()=>{
   console.log("handleCreate clcikedd")
    if(host.trim()==="" || port.trim()==="" || username.trim()==="" || password.trim()==="" || databaseName.trim() === ""){
        // alert("All fields are required ")
        //setShowAlertModal(true)
        handleShowAlertModal("All fields are required")
        return
    }
    console.log("clicked....")
    handleCreateClicked({host, port, username, password, databaseName})
  }

  const testClicked = async()=>{
       if(host.trim()==="" || port.trim()==="" || username.trim()==="" || password.trim()==="" || databaseName.trim() === "" ){
        // alert("All fields are required ")
        //setShowAlertModal(true)
        handleShowAlertModal("All fields are required")
        return
       }
      try {
        setLoading(true)
        let data = { host, port, username, password, databaseName, sourceDatabaseType, "database_type": sourceDatabaseType }
        const response = await fetch(`${serverBaseURL}/connection/test_connection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
  
        if (response.ok) {
          const data = await response.json();
          // console.log('Connection tested successfully:', data);
          // alert(data.message)
          //setShowAlertModal(true)
          handleShowAlertModal(data.message)
        } else {
          const errorData = await response.json();
          console.error('Failed to create connection:', errorData);
          // alert(errorData.message);
          //setShowAlertModal(true)
          handleShowAlertModal(errorData.message)
        }
      } catch (err){
        console.error('Error in handleTestClicked function:', err);
        // alert('An error occurred while creating the connection. Please try again later.');
        //setShowAlertModal(true)
        handleShowAlertModal("An error occurred while creating the connection. Please try again later.")
      }
      finally {
        setLoading(false)
      }
      // console.log("inside databse modal 11111111111111111111111111111111111111111111")
      // handleTestClicked({host, port, username, password, databaseName, sourceDatabaseType})
  };
  
  const handleCreateClicked = async (connection_details) => {
    try {
      setConnectionDetails(connection_details)
      await fetchSchema(connection_details)
    } catch (err) {
      console.error('Error in handleTestClicked function:', err);
      // alert('An error occurred while creating the connection. Please try again later.');
      //setShowAlertModal(true)
      handleShowAlertModal("An error occurred while creating the connection. Please try again later.")
    }
  };

  const fetchSchema = async (connection_details) => {
    try {
      setLoading(true)
      let data = { "connection_details": connection_details, "selectedDatabaseType": sourceDatabaseType }
      // console.log("data", data)
      const response = await fetch(`${serverBaseURL}/connection/fetch_schema`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const data = await response.json();
        // console.log('Schema fetched successfully11111:', data);
        setSchema(data.schema)
        setSchemaModalOpen(true)
        // alert(data.message)
        // setShowAlertModal(true)
        // handleShowAlertModal(data.message)
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch schema:', errorData);
        // alert(errorData.message);
        //setShowAlertModal(true)
        handleShowAlertModal(errorData.message)
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

  const handleCloseModal = () => {
    setHost('');
    setPort('');
    setUsername('');
    setPassword('');
    setDatabaseName('');
    handleCloseCredentialsModal();
  }

  const handleSaveSchema = async (json_result, checked_boxes) => {

    try {
      setLoading(true)
      setMapping(json_result)
      // console.log("checked array00000000000000", checked_boxes)
      // console.log("checked array00000000000000", JSON.stringify(checked_boxes))

      let user = JSON.parse(localStorage.getItem("user"))
      let data = { "user_id": user.user_id, "connection_type": sourceDatabaseType, "connection_details": connectionDetails, "mappings_details": json_result, "checked_boxes": checked_boxes }
      let response = await fetch(`${serverBaseURL}/connection/save_mapping`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        let data = await response.json();
        // alert(data.message);
        //setShowAlertModal(true)
        // handleShowAlertModal(data.message)
        handleCloseAll()
        navigate("/dashboard/connections")
        // console.log("data1111111111", data)
      } else {
        let error_data = await response.json();
        // alert(error_data.message);
        //setShowAlertModal(true)
        handleShowAlertModal(error_data.message)
        console.log("error_data111111", error_data)
      }
      // console.log(data)
    } catch (err) {
      console.log('Error in handleSaveSchema function:', err);
      // alert('An error occurred while saving the mappings. Please try again later.');
      //setShowAlertModal(true)
      handleShowAlertModal("An error occurred while saving the mappings. Please try again later.")
    }finally{
      setLoading(false)
    }
  }

  const handleSchemaModalClose = useCallback(() => {
    try {
      setSchemaModalOpen(false)
    } catch (err) {
      console.log("error in handleSchemaModalClose", err)
    }
  }, [])


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
  
  const handleCloseAll = () =>{
    try{
      setSchemaModalOpen(false)
      handleCloseCredentialsModal();
    }catch(err){
      console.log("error inside handleCloseAll", err)
    }
  }

  return (
    <div>
       <Modal
        isOpen={credentialsModalOpen}
        // onRequestClose={handleCloseModal} // Uncomment if you want to close the modal by clicking outside or pressing ESC
        style={customStyles}
        contentLabel="Example Modal"
      >
        <div className="database-modal-header" >
            <h2>Create a source</h2>
            <h4>{sourceDatabaseType}</h4>
        </div>
        <div className='database_details'>
            <div className='database_field'>
                <label>Host:</label>
                <input type='text' id='host' value={host} onChange={(e)=>{setHost(e.target.value)}}></input>
            </div>
            <div className='database_field'>
                <label>Port:</label>
                <input type='number' id='port'  min="1" max="65535" value={port} onChange={(e)=>{setPort(e.target.value)}}></input>
            </div>  
            <div className='database_field'>
                <label>Database Name</label>
                <input type='text' id='databaseName' value={databaseName} onChange={(e)=>{setDatabaseName(e.target.value)}}></input>
            </div>   
            <div className='database_field'>
                <label>User Name:</label>
                <input type='text' id='username' value={username} onChange={(e)=>{setUsername(e.target.value)}}></input>
            </div>   
            <div className='database_field'>
                <label>Password</label>
                <input type='password' id='password' value={password} onChange={(e)=>{setPassword(e.target.value)}}></input>
            </div>  
        </div>
        <div className='modal_buttons'>
            <div style={{ display:"flex", gap:"20px"}}>
                <button className='button' onClick={()=>{testClicked()}}>Test connection</button>
                <button className="button" onClick={()=>{handleCreate()}}>Fetch Schema</button>
            </div>
            <button className="button" onClick={handleCloseModal}>Close</button>
        </div>
      </Modal>
      {schema && <SchemaModal schemaModalOpen={schemaModalOpen} handleSchemaModalClose={handleSchemaModalClose} schema={schema} handleSaveSchema={handleSaveSchema}></SchemaModal>}
      {/* <Loader loading={loading} ></Loader> */}

      {/* alert modal */}
      {
      //  <AlertModal showAlertModal = {showAlertModal} handleCloseAlertModal={handleCloseAlertModal} alertMessage = {alertMessage}  ></AlertModal>
      }
    </div>
  )
}

export default DatabaseModal
