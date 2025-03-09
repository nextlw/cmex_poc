import React from 'react';
import { Box, Divider, Typography } from '@mui/material';

interface ReasoningBoxProps {
  reasoning?: string;
}

const ReasoningBox: React.FC<ReasoningBoxProps> = (props) => {
  if (!props.reasoning) return null;

  return (
    <Box
      sx={{
        '& .MuiDivider-root': {
          mt: 2,
          mb: 2,
        },
      }}
    >
      <Divider />
      <Typography variant="body1">
        {props.reasoning}
      </Typography>
    </Box>
  );
};

export default ReasoningBox; 