import React, { useCallback, useContext, useEffect, useState } from 'react'
import Modal from "react-modal"
import CheckboxTree from 'react-checkbox-tree';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import "./SchemaModal.css"
// import AlertModal from '../modals/AlertModal/AlertModal';
import ConfirmationModal from '../modals/ConfirmationModal/ConfirmationModal';
import { AppContext } from '../../contexts/AppContext';

Modal.setAppElement('#root');


const SchemaModal = ({ schemaModalOpen, handleSchemaModalClose, schema, handleSaveSchema, initiallyChecked = [], actionType, initialMappings }) => {
  const {handleShowAlertModal} = useContext(AppContext)
  const [schemaTree, setSchemaTree] = useState([]);  //  Stores the tree structure data for the database schema.
  // const [checked, setChecked] = useState(initiallyChecked);  // Stores the checked nodes (selected columns).
  const [checked, setChecked] = useState([]);  // Stores the checked nodes (selected columns).
  const [expanded, setExpanded] = useState([]); // Stores the expanded nodes (tables that are opened to show their columns).
  // const [showAlertModal, setShowAlertModal] = useState(false)
  // const [alertMessage, setAlertMessage] = useState("")
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState("")
  useEffect(() => {
    try {

      const treeData = transformSchemaToTreeData(schema);
      setSchemaTree(treeData);
      // setChecked(initiallyChecked)
      if (actionType === "update") {
        const chcekedArray = reverseJsonToChecked(initialMappings)
        setChecked(chcekedArray)
      }

    } catch (error) {
      console.log('Error converting schema to tree:', error);
      // setShowAlertModal(true)
      handleShowAlertModal("Something Went Wrong")
    }
  }, [schema]);

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

  const handleCloseModal = () => {
    try {
      setChecked([])
      setExpanded([])
      setSchemaTree([])
      handleSchemaModalClose()
    } catch (err) {
      console.log("error in handleCloseModal", err)
      //setShowAlertModal(true)
      handleShowAlertModal("Something Went Wrong")
    }
  }

  const reverseJsonToChecked = (destinationJson) => {
    try {
      console.log("destinationJson1111111111111", destinationJson)
      const checkedArray = [];

      destinationJson.tables.forEach(table => {
        const tableName = table.table_name;
        table.columns.forEach(column => {
          checkedArray.push(`${tableName}.${column}`);
        });
      });

      return checkedArray;
    } catch (err) {
      console.log("error in reverseJsonToChecked", err);
      //setShowAlertModal(true)
      handleShowAlertModal("Something Went Wrong")
      return [];
    }
  };


  const transformSchemaToTreeData = (schema) => {
    try {
      // its creating an array of keys of table names basically ["connections", "users"].
      return Object.keys(schema).map((table) => ({  // here for first iteration table value is "connections"
        value: table,   // here table  = "connections"
        label: table,
        children: schema[table].map((column) => ({  // here we are iterating through each table value
          // whcih is a array of objects and creating a new array of object
          // where each object have value and label as key.
          value: `${table}.${column.name}`,
          label: `${column.name} (${column.type})`,
        })),
      }));
    } catch (err) {
      console.log("error inside transformSchemaToTreeData", err)
      //setShowAlertModal(true)
      handleShowAlertModal("Something Went Wrong")
      return null
    }
  };



  const handleCreateConnection = useCallback(() => {
    try {
      const selectedItems = checked.map(item => {
        const [table, column] = item.split('.'); 
        return { table, column };
      });

      if (!selectedItems.length) {
        console.log("triggereddddddd")
        handleShowAlertModal("Please Select some Fileds")
        //setShowAlertModal(true)
        return
      }
      // console.log("selectedItems1111111111111111",selectedItems)

      const jsonStructure = {};
      // this will going to create an objects with table names as keys and each key will 
      // will have a array of slected columns from that particular table
      selectedItems.forEach(item => {
        if (!jsonStructure[item.table]) {
          jsonStructure[item.table] = [];
        }
        jsonStructure[item.table].push(item.column);
      });


      const destinationJson = { tables: Object.entries(jsonStructure).map(([table_name, columns]) => ({ table_name, columns })) };
      handleSaveSchema(destinationJson, checked);
      setShowConfirmationModal(false)

      // setChecked([])
      // setExpanded([])
      // setSchemaTree([])
      console.log(JSON.stringify(destinationJson, null, 2));
      // console.log("Created JSON structure:", jsonStructure);
    } catch (err) {
      console.log("error in handleCreateConnection", err)
      //setShowAlertModal(true)
      handleShowAlertModal("Something Went Wrong")
    }
  }, [checked, ]);

  // const handleCloseAlertModal = useCallback(() => {
  //   try {
  //     //setShowAlertModal(false)
  //     setAlertMessage("")
  //   } catch (err) {
  //     console.log("error inside the handleCloseAlertModal", err)
  //     //setShowAlertModal(true)
  //     setAlertMessage("Something Went Wrong")
  //   }
  // },[])



  const handleCloseConfirmationModal = useCallback(() => {
    try {
      setShowConfirmationModal(false)
    } catch (err) {
      console.log("error inside the handleCloseConfirmationModal", err)
    }
  }, [])

  const handleCreateConnectionClicked = () =>{
    try{
      // const selectedItems = checked.map(item => {
      //   const [table, column] = item.split('.'); // item slipped into two elements and assigned to table and column variables
      //   return { table, column };
      // });

      if (!checked.length) {
        console.log("triggereddddddd")
        handleShowAlertModal("Please Select some Fileds")
        //setShowAlertModal(true)
        return
      }
      if(actionType === "update"){
        setConfirmationMessage("Confirm to Update Mappings")
      }else{
        setConfirmationMessage("Confirm to create a new Connection")
      }
      setShowConfirmationModal(true)
    }catch(err){
      console.log("error inside handleCreateConnectionClicked", err)
    }
  }

  return (
    <div>
      <Modal
        isOpen={schemaModalOpen}
        // onRequestClose={handleCloseModal} 
        style={customStyles}
        contentLabel="Example Modal"
      >
        <div className='moadlMainDiv' >
          {actionType === "update" ? <h1>Update mappings for Destination</h1> : <h1>Create mappings for Destination</h1>}


          <div className="tree">
            <CheckboxTree
              nodes={schemaTree}  // schemaTree array of objects where each objet value lable and child if any
              checked={checked}  //  array ["connections.id", "users.email"] values of nodes that are currently checked (selected).
              expanded={expanded}  // stores the values of nodes in array that are currently expanded (opened to show their children). ["connections"]
              onCheck={(checked) => setChecked(checked)}  // it updates the checked array with this presently checked value updated array
              onExpand={(expanded) => setExpanded(expanded)}
            />
          </div>
          <div className='modal_buttons'>
            <div style={{ display: "flex", gap: "20px", justifyContent: "center", alignItems: "center", width: "100%" }}>
              <button className='button' onClick={()=>handleCreateConnectionClicked()}>
                {actionType === "update" ? "Update Connection" : "Create New Connection"}
              </button>
              {/* <button className="button" onClick={() => { }}>Create</button> */}
              <button className="button" onClick={handleCloseModal}>Cancel</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Alert modal */}
      {/* <AlertModal showAlertModal={showAlertModal} handleCloseAlertModal={handleCloseAlertModal} alertMessage={alertMessage}  ></AlertModal> */}

      {/* ConfirmationModal for saving connection and mapping details */}
      <ConfirmationModal
        showConfirmationModal={showConfirmationModal}
        handleCloseConfirmationModal={handleCloseConfirmationModal}
        confirmationMessage={confirmationMessage}
        functionTocallOnYesClicked={handleCreateConnection}
        yesButtonLabel={"Yes"}
      ></ConfirmationModal>

    </div>
  )
}


export default SchemaModal