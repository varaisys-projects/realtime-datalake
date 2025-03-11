import React, {createContext, useState} from 'react'

// this is the context created for the connection
export const ConnectionContext = createContext()

// this is a componenet which takes a child component and return this child component by wrapping with the provider of context...
export const ConnectionContextProvided = ({children}) => {
 

  let ConnectionContextValues = {}

  return (
    <ConnectionContext.Provider value={ConnectionContextValues}>
        {children}
    </ConnectionContext.Provider>
  )
}