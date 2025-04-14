async function uploadFile() {
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];
  const expiry = document.getElementById("expiry").value;
  const timeValue = document.getElementById("expiryTime").value;

  // Check if a file is selected
  if (!file) {
    showAlert("Please choose a file to upload.", "error");
    return;
  }

  // Prepare FormData for file upload
  const formData = new FormData();
  formData.append("file", file); // Attach the file to the formData
  formData.append("expiry", expiry); // Add expiry type if selected
  if (timeValue) formData.append("expiryTime", timeValue); // Add expiry time if provided

  const apiUrl = "https://api.upload.io/v1/files"; // Correct API endpoint
  const apiKey = "public_G22nhgTDm1B4ZvL1ia7nmepwHaYL"; // Replace with your Upload.io API key

  try {
    // Perform the file upload request to Upload.io
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`, // Your Upload.io API key for authentication
      },
      body: formData,
    });

    // Log the status and response body for debugging
    console.log("Response Status:", response.status);
    console.log("Response Headers:", response.headers);

    const data = await response.json();

    // Handle the response
    if (response.ok && data.url) {
      const fileLink = document.getElementById("fileLink");
      fileLink.href = data.url; // Assuming the response contains the file URL
      fileLink.textContent = data.url;

      document.getElementById("result").style.display = "block";
      showAlert("File uploaded successfully! See the link below.", "success");
    } else {
      console.error("Upload failed:", data);
      showAlert("Failed to upload file. Please check the console for more details.", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showAlert("Failed to upload file. Check your internet or try again later.", "error");
  }
}

function showAlert(message, type) {
  const alertBox = document.getElementById("alert");
  alertBox.className = `alert ${type}`;
  alertBox.textContent = message;
  alertBox.style.display = "block";
}
