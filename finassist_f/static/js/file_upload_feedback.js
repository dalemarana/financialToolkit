
// Function to check if file is uploaded to the server successfully
async function uploadFormData(formData) {
    try {

        const response = await fetch('/fileman/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const data = await response.json(); // If the server returns JSON response
            document.getElementById('message').innerHTML = "File Uploaded successfully: " + data.message;
            document.getElementById('save').disabled = false;
            document.getElementById('update').disabled = false;
        } else {
            document.getElementById('message').innerHTML = "File upload failed: " + response.statusText;
        }
    } catch (error) {
        console.error('Error Uploading file: ', error);
        document.getElementById('message').innerHTML = "Error uploading file: " + error.message;
    } finally {
        document.getElementById('loadingMessage').classList.add('d-none');
        document.getElementById('message').classList.remove('d-none');
    }
}


// Event listener for form submission
document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    document.getElementById('uploadForm').classList.add('d-none');
    document.getElementById('upForm').classList.remove('d-none');
    document.getElementById('message').classList.add('d-none');

    // Create a FormData object from the form
    const formData = new FormData(event.target);

    // Call the uploadFormData function with the FormData object
    await uploadFormData(formData);

});
