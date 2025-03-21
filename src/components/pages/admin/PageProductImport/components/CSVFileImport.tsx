import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import axios from "axios";
import { Button } from "@mui/material";

type CSVFileImportProps = {
  url: string;
  title: string;
};
const token = localStorage.getItem("authorization_token");
  console.log("Authorization Token:", token);

export default function CSVFileImport({ url, title }: CSVFileImportProps) {
  const [file, setFile] = React.useState<File>();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
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
  
    console.log("uploadFile to to", url);
  
    try {
      // Get the presigned URL
      const response = await axios({
        method: "GET",
        url,
        params: { name: encodeURIComponent(file.name)
         },
         headers: {
          Authorization: `Basic ${token}`,
        },
      });
  
      console.log("File to upload: ", file.name);
      console.log("Uploading to: ", response.data);
  
      const result = await fetch(response.data, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "text/csv",
          "Access-Control-Allow-Origin": "*",
        },
        mode: 'cors'
      });
  
      console.log("Result: ", result);
      setFile(undefined); // Clear the file after upload
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };
  

  // const uploadFile = async () => {
  //   console.log("uploadFile to", url);

  //   //Get the presigned URL
  //   const response = await axios({
  //     method: "GET",
  //     url,
  //     params: {
  //       name: encodeURIComponent(file.name),
  //     },
  //   });
  //   console.log("File to upload: ", file.name);
  //   console.log("Uploading to: ", response.data);
  //   const result = await fetch(response.data, {
  //     method: "PUT",
  //     body: file,
  //   });
  //   console.log("Result: ", result);
  //   setFile("");
  // };
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {!file ? (
        <input type="file" onChange={onFileChange} />
      ) : (
        <div>
          <button onClick={removeFile}>Remove file</button>
          <button onClick={uploadFile}>Upload file</button>
        </div>
      )}
    </Box>
  );
}
