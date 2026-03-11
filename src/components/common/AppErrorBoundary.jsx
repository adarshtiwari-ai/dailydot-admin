import React from "react";
import Box from "@mui/material/Box";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box p={4} textAlign="center">
                    <h1>Something went wrong.</h1>
                    <pre style={{ color: "red", textAlign: "left" }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button onClick={() => window.location.reload()}>Reload Page</button>
                </Box>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
