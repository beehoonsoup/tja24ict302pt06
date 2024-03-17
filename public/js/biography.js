function viewBiography(reviewerID) {
  // Make an AJAX POST request to the backend route with the reviewerID as a URL parameter
  fetch(`/biography/${reviewerID}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (response.ok) {
        // Redirect to the biography page if the request is successful
        window.location.href = '/biography';
      } else {
        // Handle errors if needed
        console.error('Error:', response.statusText);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
