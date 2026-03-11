import React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

const LoadingComponent = () => {
    console.log("LoadingComponent: Rendering persist gate loading...");
    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100vh"
            bgcolor="#f5f7fa"
        >
            <Box textAlign="center">
                <CircularProgress size={50} />
                <div style={{ marginTop: "16px", color: "#666" }}>
                    Loading Redux Store...
                </div>
            </Box>
        </Box>
    );
};

export default LoadingComponent;
