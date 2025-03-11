// src/components/MainContent.js
import React, { useContext, useState } from "react";
import "./Sources.css";
import Searchbar from "../../../components/Searchbar/Searchbar";
import DatabaseCard from "../../../components/DatabaseCard/DatabaseCard";
import DatabaseModal from "../../../components/DatabaseModal/DatabaseModal";
import SchemaModal from "../../../components/SchemaModal/SchemaModal";
import Loader from "../../../components/Loader/Loader";
import { AppContext } from "../../../contexts/AppContext";



function Sources() {
  const databases = ["MySQL", "PostgreSQL", "Oracle", "SQL Server", "MySQL", "PostgreSQL", "Oracle", "SQL Server", "MySQL", "PostgreSQL", "Oracle", "SQL Server", "MySQL", "PostgreSQL", "Oracle", "SQL Server", "MySQL", "PostgreSQL", "Oracle", "SQL Server"];

  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [selectedDatabaseType, setSelectedDatabaseType] = useState(null)
  const [schemaModalOpen, setSchemaModalOpen] = useState(false)
  const [schema, setSchema] = useState(null)
  const [connectionDetails, setConnectionDetails] = useState("")
  const [mapping, setMapping] = useState(null)
  const [loading, setLoading] = useState(false)
  const {serverBaseURL} = useContext(AppContext)

  const handleCloseCredentialsModal = () => {
    setCredentialsModalOpen((credentialsModalOpen) => (!credentialsModalOpen))
    setSelectedDatabaseType(null)
  }

  const handleSchemaModalClose = () => {
    try {
      setSchemaModalOpen(false)
    } catch (err) {
      console.log("error in handleSchemaModalClose", err)
    }
  }

  const onConnect = (name) => {
    // console.log("connect clicked 000000000")
    setSelectedDatabaseType(name)
    setCredentialsModalOpen((credentialsModalOpen) => (!credentialsModalOpen))
  }


  // const handleTestClicked = async (connection_details) => {
  //   try {
  //     setLoading(true)
  //     let data = { ...connection_details, "database_type": selectedDatabaseType }
  //     // console.log("data", data)
  //     const response = await fetch(`${serverBaseURL}/connection/test_connection`, {
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

  const fetchSchema = async (connection_details) => {

    try {
      setLoading(true)
      let data = { "connection_details": connection_details, "selectedDatabaseType": selectedDatabaseType }
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
        // console.log('Schema fetched successfully:', data);
        setSchema(data.schema)
        setSchemaModalOpen(true)
        alert(data.message)
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch schema:', errorData);
        alert(errorData.message);
      }
    } catch (err) {
      console.error('Error in fetchSchema function:', err);
      alert('An error occurred while fetching schema. Please try again later.');
    } finally {
      setLoading(false)
    }
  };


  const handleCreateClicked = async (connection_details) => {
    try {
      setConnectionDetails(connection_details)
      await fetchSchema(connection_details)
    } catch (err) {
      console.error('Error in handleTestClicked function:', err);
      alert('An error occurred while creating the connection. Please try again later.');
    }
  };


  const handleSaveSchema = async (json_result, checked_boxes) => {

    try {
      setLoading(true)
      setMapping(json_result)
      // console.log("checked array00000000000000", checked_boxes)
      // console.log("checked array00000000000000", JSON.stringify(checked_boxes))

      let user = JSON.parse(localStorage.getItem("user"))
      let data = { "user_id": user.user_id, "connection_type": selectedDatabaseType, "connection_details": connectionDetails, "mappings_details": json_result, "checked_boxes": checked_boxes }
      let response = await fetch(`${serverBaseURL}/connection/save_mapping`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        let data = await response.json();
        alert(data.message);
        // console.log("data1111111111", data)
      } else {
        let error_data = await response.json();
        alert(error_data.message);
        console.log("error_data111111", error_data)
      }
      // console.log(data)
    } catch (err) {
      console.log('Error in handleSaveSchema function:', err);
      alert('An error occurred while saving the mappings. Please try again later.');
    }finally{
      setLoading(false)
    }
  }

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
      <DatabaseModal handleCloseCredentialsModal={handleCloseCredentialsModal} credentialsModalOpen={credentialsModalOpen} sourceDatabaseType={selectedDatabaseType}  handleCreateClicked={handleCreateClicked}></DatabaseModal>
      {schema && <SchemaModal schemaModalOpen={schemaModalOpen} handleSchemaModalClose={handleSchemaModalClose} schema={schema} handleSaveSchema={handleSaveSchema}></SchemaModal>}
      <Loader loading={loading}></Loader>
    </div>
  );
}

export default Sources;