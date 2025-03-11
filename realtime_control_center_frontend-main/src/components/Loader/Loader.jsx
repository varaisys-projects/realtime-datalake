import React, { useContext } from 'react';
import HashLoader from 'react-spinners/HashLoader';
import { AppContext } from '../../contexts/AppContext';

const override = {
  display: 'block',
  margin: '0 auto',
  borderColor: 'red',
};

function Loader() {
  const {loading} = useContext(AppContext)

  if (!loading) return null;

  return (
    <div style={overlayStyle}>
      <div style={loaderContainerStyle}>
        <HashLoader
          color={"#000000"}
          loading={loading}
          cssOverride={override}
          size={50}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(99, 90, 90, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 99999
};

const loaderContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
};

export default Loader;
