// src/components/MainContent.js
import React, { useCallback, useContext, useState } from "react";
import "./Sources.css";
import Searchbar from "../../../components/Searchbar/Searchbar";
import DatabaseCard from "../../../components/DatabaseCard/DatabaseCard";
import DatabaseModal from "../../../components/DatabaseModal/DatabaseModal";
import SchemaModal from "../../../components/SchemaModal/SchemaModal";
// import Loader from "../../../components/Loader/Loader";
// import AlertModal from "../../../components/modals/AlertModal/AlertModal";
import { AppContext } from "../../../contexts/AppContext";



function Sources() {

  const databases = ["MySQL", "PostgreSQL", "Oracle", "SQL Server", "MySQL", "PostgreSQL", "Oracle", "SQL Server", "MySQL", "PostgreSQL", "Oracle", "SQL Server", "MySQL", "PostgreSQL", "Oracle", "SQL Server", "MySQL", "PostgreSQL", "Oracle", "SQL Server"];
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [selectedDatabaseType, setSelectedDatabaseType] = useState(null)
  // const [schemaModalOpen, setSchemaModalOpen] = useState(false)
  // const [schema, setSchema] = useState(null)
  // const [connectionDetails, setConnectionDetails] = useState("")
  // const [mapping, setMapping] = useState(null)
  // const [loading, setLoading] = useState(false)
  // const [showAlertModal, setShowAlertModal] = useState(false)
  // const [alertMessage, setAlertMessage] = useState("")
  const {setLoading, handleShowAlertModal } = useContext(AppContext)
  const handleCloseCredentialsModal = useCallback(() => {
    try {
      setCredentialsModalOpen((credentialsModalOpen) => (!credentialsModalOpen))
      setSelectedDatabaseType(null)
    } catch (err) {
      //setShowAlertModal(true)
      handleShowAlertModal("Something Went Wrong")
      // alert("something Went wrong")
      console.log("error inside handleCloseCredentialsModal", err)

    }

  }, [])

  // const handleCloseAlertModal = useCallback(() => {
  //   try {
  //     setShowAlertModal(false)
  //     setAlertMessage("")
  //   } catch (err) {
  //     console.log("error inside handleCloseAlertModal", err)
  //   }
  // }, [])

  // const handleSchemaModalClose = () => {
  //   try {
  //     setSchemaModalOpen(false)
  //   } catch (err) {
  //     console.log("error in handleSchemaModalClose", err)
  //   }
  // }

  const onConnect = useCallback((name) => {
    try {
      // console.log("connect clicked 000000000")
      setSelectedDatabaseType(name)
      setCredentialsModalOpen((credentialsModalOpen) => (!credentialsModalOpen))
    } catch (err) {
      //setShowAlertModal(true)
      handleShowAlertModal("Something Went Wrong")
      // alert("Something went wrong")
    }

  }, [])


  // const handleTestClicked = async (connection_details) => {
  //   try {
  //     setLoading(true)
  //     let data = { ...connection_details, "database_type": selectedDatabaseType }
  //     // console.log("data", data)
  //     const response = await fetch('http://localhost:3002/connection/test_connection', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(data),
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       // console.log('Connection tested successfully:', data);
  //       alert(data.message)
  //     } else {
  //       const errorData = await response.json();
  //       console.error('Failed to create connection:', errorData);
  //       alert(errorData.message);
  //     }
  //   } catch (err){
  //     console.error('Error in handleTestClicked function:', err);
  //     alert('An error occurred while creating the connection. Please try again later.');
  //   }
  //   finally {
  //     setLoading(false)
  //   }
  // };

  // const fetchSchema = async (connection_details) => {

  //   try {
  //     setLoading(true)
  //     let data = { "connection_details": connection_details, "selectedDatabaseType": selectedDatabaseType }
  //     // console.log("data", data)
  //     const response = await fetch('http://localhost:3002/connection/fetch_schema', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(data),
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       // console.log('Schema fetched successfully:', data);
  //       setSchema(data.schema)
  //       setSchemaModalOpen(true)
  //       alert(data.message)
  //     } else {
  //       const errorData = await response.json();
  //       console.error('Failed to fetch schema:', errorData);
  //       alert(errorData.message);
  //     }
  //   } catch (err) {
  //     console.error('Error in fetchSchema function:', err);
  //     alert('An error occurred while fetching schema. Please try again later.');
  //   } finally {
  //     setLoading(false)
  //   }
  // };


  // const handleCreateClicked = async (connection_details) => {
  //   try {
  //     setConnectionDetails(connection_details)
  //     await fetchSchema(connection_details)
  //   } catch (err) {
  //     console.error('Error in handleTestClicked function:', err);
  //     alert('An error occurred while creating the connection. Please try again later.');
  //   }
  // };


  return (
    <div className="sources">
      <h1>Connect Source Database</h1>
      {/* <div className="search-bar">
        <input type="text" placeholder="Search databases..." />
        <button className="ConnectButton">Search</button>
      </div> */}
      <div className="databaseList">
        {databases.map((db, index) => (
          <DatabaseCard key={index} name={db} onConnect={onConnect} />
        ))}
      </div>
      <DatabaseModal handleCloseCredentialsModal={handleCloseCredentialsModal} credentialsModalOpen={credentialsModalOpen} sourceDatabaseType={selectedDatabaseType}  ></DatabaseModal>
      {/* {schema && <SchemaModal schemaModalOpen={schemaModalOpen} handleSchemaModalClose={handleSchemaModalClose} schema={schema} handleSaveSchema={handleSaveSchema}></SchemaModal>} */}
      {/* <Loader loading={loading}></Loader> */}

      {/* <AlertModal showAlertModal={showAlertModal} handleCloseAlertModal={handleCloseAlertModal} alertMessage={alertMessage}></AlertModal> */}
    </div>
  );
}

export default Sources;