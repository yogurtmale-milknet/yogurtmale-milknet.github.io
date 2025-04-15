document.addEventListener('DOMContentLoaded', function() {
    // Generate or retrieve the username from localStorage
    function generateRandomUsername() {
        const randomNum = Math.floor(Math.random() * 100000);
        return `milkenjoyer${randomNum.toString().padStart(3, '0')}`;
    }

    // Check if username is already saved, else generate a new one
    let username = localStorage.getItem('username');
    if (!username) {
        username = generateRandomUsername();
        localStorage.setItem('username', username); // Save username to localStorage
    }
    document.getElementById('username').innerText = username;

    // Retrieve stored posts from localStorage or initialize empty array
    let posts = JSON.parse(localStorage.getItem('posts')) || [];

    // Function to render posts
    function renderPosts() {
        postsSection.innerHTML = ''; // Clear current posts
        posts
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Sort posts by descending date
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

                postsSection.prepend(postDiv); // Add post to the beginning
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

        const newPost = {
            username: username,
            content: content,
            timestamp: new Date().toISOString() // Store the timestamp for sorting
        };

        posts.push(newPost);
        localStorage.setItem('posts', JSON.stringify(posts)); // Save posts to localStorage
        renderPosts(); // Re-render posts
        postContent.value = ''; // Clear post content
    });
});
