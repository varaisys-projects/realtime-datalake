import React, { useContext, useEffect, useState } from 'react'
import Modal from "react-modal"
import "./DatabaseModal.css"
import Loader from '../Loader/Loader';
import { AppContext } from '../../contexts/AppContext';
Modal.setAppElement('#root');

const DatabaseModal = ({credentialsModalOpen, handleCloseCredentialsModal, sourceDatabaseType="Source Database Type" , handleCreateClicked, connectionDetails}) => {

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

  const [host, setHost] = useState('192.168.29.18');
  const [port, setPort] = useState('3336');
  const [username, setUsername] = useState('ajay');
  const [password, setPassword] = useState('Varaisys!123');
  const [databaseName, setDatabaseName] = useState('ajay_test');
  const [loading, setLoading] = useState(false)
  const {serverBaseURL} = useContext(AppContext)

  useEffect(() => {
    if (connectionDetails) {
      setHost(connectionDetails.host );
      setPort(connectionDetails.port );
      setUsername(connectionDetails.username );
      setPassword(connectionDetails.password );
      setDatabaseName(connectionDetails.databaseName );
    }
  }, [connectionDetails]);


 const handleCreate =()=>{
    if(host.trim()==="" || port.trim()==="" || username.trim()==="" || password.trim()===""){
        alert("All fields are required ")
        return
    }
    console.log("clicked....")
    handleCreateClicked({host, port, username, password, databaseName})
  }

  const testClicked = async()=>{
       if(host.trim()==="" || port.trim()==="" || username.trim()==="" || password.trim()===""){
        alert("All fields are required ")
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
          alert(data.message)
        } else {
          const errorData = await response.json();
          console.error('Failed to create connection:', errorData);
          alert(errorData.message);
        }
      } catch (err){
        console.error('Error in handleTestClicked function:', err);
        alert('An error occurred while creating the connection. Please try again later.');
      }
      finally {
        setLoading(false)
      }
      console.log("inside databse modal 11111111111111111111111111111111111111111111")
      // handleTestClicked({host, port, username, password, databaseName, sourceDatabaseType})
  };
  

  const handleCloseModal = () => {
    setHost('');
    setPort('');
    setUsername('');
    setPassword('');
    setDatabaseName('');
    handleCloseCredentialsModal();
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
      <Loader loading={loading} ></Loader>
    </div>
  )
}

export default DatabaseModal
