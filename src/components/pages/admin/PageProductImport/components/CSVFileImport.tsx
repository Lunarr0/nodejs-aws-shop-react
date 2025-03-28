import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import axios from "axios";
import { Button, Snackbar, Alert } from "@mui/material";

type CSVFileImportProps = {
  url: string;
  title: string;
};

export default function CSVFileImport({ url, title }: CSVFileImportProps) {
  const [file, setFile] = React.useState<File | undefined>(undefined);
  const [error, setError] = React.useState<{ message: string; open: boolean }>({
    message: "",
    open: false,
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const removeFile = () => {
    setFile(undefined);
  };

  const uploadFile = async () => {
    if (!file) {
      console.error("No file selected.");
      return;
    }

    // Retrieve the token from local storage
    const token = localStorage.getItem("authorization_token");
    console.log("Authorization Token:", token); // Log the token

    // Set up the headers with an empty authorization if token is null
    const headers = {
      Authorization: token ? `Basic ${token}` : "", // Allow empty header
    };

    console.log("Uploading file to", url);

    try {
      // Get the presigned URL
      const response = await axios.get(url, {
        params: { name: encodeURIComponent(file.name) },
        headers,
      });

      console.log("File to upload: ", file.name);
      console.log("Uploading to: ", response.data);

      // Upload file to the signed URL
      const result = await fetch(response.data, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "text/csv",
        },
      });

      console.log("Result: ", result);
      setFile(undefined); // Clear the file after successful upload
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        // Handle specific status codes
        const status = error.response?.status;
        if (status === 401) {
          setError({ message: "Unauthorized. Please sign in.", open: true });
        } else if (status === 403) {
          setError({ message: "You don't have permission to upload this file.", open: true });
        } else {
          setError({ message: "An error occurred while uploading the file.", open: true });
        }
      } else {
        setError({ message: "An unexpected error occurred.", open: true });
      }
      console.error("Error uploading file:", error);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {!file ? (
        <input type="file" onChange={onFileChange} />
      ) : (
        <div>
          <Button variant="contained" color="secondary" onClick={removeFile}>
            Remove file
          </Button>
          <Button variant="contained" color="primary" onClick={uploadFile}>
            Upload file
          </Button>
        </div>
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={error.open}
        autoHideDuration={6000}
        onClose={() => setError({ ...error, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setError({ ...error, open: false })}
          severity="error"
        >
          {error.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
