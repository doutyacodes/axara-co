import React from 'react';
import { Slider } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

const GreenSlider = ({ choices, selectedChoice, onChange, key }) => {
  const isSmallScreen = useMediaQuery('(max-width:600px)');
  const isMediumScreen = useMediaQuery('(max-width:1024px)');

  // Calculate the middle index
  const middleIndex = Math.floor((choices.length - 1) / 2);

  const handleChange = (event, value) => {
    onChange(choices[value]);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <Slider
        key={key}
        defaultValue={middleIndex}
        min={0}
        max={choices.length - 1}
        step={1}
        onChange={handleChange}
        valueLabelDisplay="off"
        marks={choices.map((choice, index) => ({
          value: index,
          label: choice.choiceText,
        }))}
        sx={{
          color: '#4caf50', // Base color for the slider
          width: '100%', 
          '& .MuiSlider-rail': {
            opacity: 0.3,
            background: 'linear-gradient(90deg, #ff9800, #ffffff, #ff9800)', // Subtle gradient for the rail
            height: 6,
          },
          '& .MuiSlider-track': {
            background: 'linear-gradient(90deg, #43a047, #66bb6a)',
            height: 6,
            border: 'none',
          },
          '& .MuiSlider-thumb': {
            height: 18,
            width: 18,
            background: 'linear-gradient(135deg, #43a047, #66bb6a)', // Green gradient thumb
            border: '2px solid #ffffff',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', // Soft shadow for elevation
            '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
              boxShadow: '0px 0px 8px 4px rgba(67, 160, 71, 0.3)', // Glow on hover or focus
            },
          },
          '& .MuiSlider-markLabel': {
            color: 'black',
            fontSize: isSmallScreen ? '10px' : isMediumScreen ? '12px' : '14px',
            marginTop: '14px',
            maxWidth: isSmallScreen ? '45px' : isMediumScreen ? '65px' : '80px',
            textAlign: 'center',
            transition: 'color 0.3s ease, transform 0.3s ease',
            '&:hover': {
              color: '#4caf50',
              fontWeight: 'bold',
              transform: 'scale(1.1)', // Slight zoom on hover
            },
          },
          '& .MuiSlider-mark': {
            width: '3px',
            height: '10px',
            backgroundColor: '#4caf50', // Matches the thumb color
          },
        }}
      />
    </div>
  );
};

export default GreenSlider;
