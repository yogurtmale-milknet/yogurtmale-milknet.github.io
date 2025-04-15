function uploadImage() {
  const fileInput = document.getElementById('image-upload');
  const file = fileInput.files[0];

  if (!file) {
    alert('Please select an image to upload.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  // Send the file to culiao.lol for upload
  fetch('https://culiao.lol/upload', {
    method: 'POST',
    body: formData,
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const imageUrl = data.url; // Assuming the response includes the URL
      alert('Image uploaded successfully! Image URL: ' + imageUrl);
      addImageToPost(imageUrl);
    } else {
      console.error('Upload failed:', data);
      alert('Image upload failed. Please try again.');
    }
  })
  .catch(error => {
    console.error('Error uploading image:', error);
    alert('An error occurred during image upload.');
  });
}

function addImageToPost(imageUrl) {
  const postContent = document.getElementById('post-content');
  postContent.value += `\n![Image](${imageUrl})`; // Add image URL to post content
}

function submitPost() {
  const postContent = document.getElementById('post-content').value;
  if (!postContent) {
    alert("Please write something before submitting.");
    return;
  }

  // Here you can process the post content and submit it to your forum (e.g., save it to localStorage or display on the page)
  console.log("Post submitted: " + postContent);
  alert("Post submitted!");
}
