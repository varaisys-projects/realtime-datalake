// src/components/DatabaseCard/DatabaseCard.js
import React from 'react';
import './DatabaseCard.css';

const DatabaseCard = ({ name, onConnect }) => {
  
  
  return (
    <div className="DatabaseCard">
        <h2 className="DatabaseName">{name}</h2>
        <button className="button" onClick={()=>{onConnect(name)}}>Connect</button>
    </div>
  );
};

export default DatabaseCard;