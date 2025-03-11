import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import "./LongMenu.css";

const ITEM_HEIGHT = 68;

export default function LongMenu({ 
  options=[], 
  onOptionClick, 
  fullListDetails,   
  isOptionDisabled = () => false, // default to no options being disabled
}) {
  const [anchorEl, setAnchorEl] = useState(null); // this is storing that which one is sleected from options 
  const open = Boolean(anchorEl); // when the above anchorEl state is set to any value it 

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (clickedOption) => {
    onOptionClick(clickedOption, fullListDetails);
    handleClose();
  };

  return (
    <div>
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="long-menu"
        MenuListProps={{
          'aria-labelledby': 'long-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            minWidth: '20ch',
          },
        }}
      >
        {options.map((option) => (
          <MenuItem 
            key={option} 
            onClick={() => handleMenuItemClick(option,)}
            // disabled={option === "Start"}
            disabled={isOptionDisabled(option, fullListDetails)}
            >
            {option}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}
