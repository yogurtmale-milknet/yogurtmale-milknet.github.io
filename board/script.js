document.addEventListener('DOMContentLoaded', function() {
    function generateRandomUsername() {
        const randomNum = Math.floor(Math.random() * 1000);  
        return `milkenjoyer[${randomNum.toString().padStart(3, '0')}]`;  
    }

    // Check if username is already saved in localStorage
    let username = localStorage.getItem('username');
    if (!username) {
        username = generateRandomUsername();  // Temporary username until the first post
    }
    document.getElementById('username').innerText = username;

    // Retrieve stored posts from localStorage or initialize as an empty array
    let posts = JSON.parse(localStorage.getItem('posts')) || [];

    // Function to render posts
    function renderPosts() {
        postsSection.innerHTML = ''; // Clear current posts
        posts
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Sort by descending date
            .forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.classList.add('post');

                const postUsername = document.createElement('p');
                postUsername.classList.add('username');
                postUsername.innerText = post.username;
                postDiv.appendChild(postUsername);

                const postContent = document.createElement('p');
                postContent.classList.add('content');
                postContent.innerText = post.content;
                postDiv.appendChild(postContent);

                postsSection.prepend(postDiv); // Add post at the beginning
            });
    }

    // Initial render of posts
    const postsSection = document.getElementById('posts-section');
    renderPosts();

    // Handle post submission
    const postForm = document.getElementById('post-form');
    const postContent = document.getElementById('post-content');

    postForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const content = postContent.value.trim();
        if (!content) return;

        // Create a new post with a timestamp
        const newPost = {
            username: username,
            content: content,
            timestamp: new Date().toISOString() // Store timestamp for sorting
        };

        posts.push(newPost);
        localStorage.setItem('posts', JSON.stringify(posts)); // Save posts to localStorage

        // After the first post, save the username permanently in localStorage
        if (!localStorage.getItem('username')) {
            localStorage.setItem('username', username);
        }

        renderPosts(); // Re-render posts
        postContent.value = ''; // Clear the post content field
    });
});
