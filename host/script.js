async function uploadFile() {
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];
  const expiry = document.getElementById("expiry").value;
  const timeValue = document.getElementById("expiryTime").value;

  if (!file) {
    showAlert("Please choose a file to upload.", "error");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("expiry", expiry);
    formData.append("expiryTime", timeValue);

    // Replace with your actual Upload.io API URL and API key
    const apiUrl = "https://api.upload.io/upload"; // Placeholder API URL
    const apiKey = "public_G22nhgTDm1B4ZvL1ia7nmepwHaYL"; // Replace with your Upload.io API key

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (data && data.url) {
      const fileLink = document.getElementById("fileLink");
      fileLink.href = data.url; // Assuming the response contains the file URL
      fileLink.textContent = data.url;

      document.getElementById("result").style.display = "block";
      showAlert("Success!", "success");
    } else {
      throw new Error("Failed to upload.");
    }
  } catch (error) {
    console.error("Upload failed:", error);
    showAlert("Failed to upload.", "error");
  }
}

function showAlert(message, type) {
  const alertBox = document.getElementById("alert");
  alertBox.className = `alert ${type}`;
  alertBox.textContent = message;
  alertBox.style.display = "block";
}
