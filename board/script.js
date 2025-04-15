document.addEventListener('DOMContentLoaded', function() {
    // Generate random username
    function generateRandomUsername() {
        const randomNum = Math.floor(Math.random() * 100000);
        return `milkenjoyer${randomNum.toString().padStart(5, '0')}`;
    }

    const username = generateRandomUsername();
    document.getElementById('username').innerText = username;

    // Handle post submission
    const postForm = document.getElementById('post-form');
    const postContent = document.getElementById('post-content');
    const postsSection = document.getElementById('posts-section');

    postForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const content = postContent.value.trim();
        if (!content) return;

        const post = document.createElement('div');
        post.classList.add('post');

        const postUsername = document.createElement('p');
        postUsername.classList.add('username');
        postUsername.innerText = username;
        post.appendChild(postUsername);

        const postContentEl = document.createElement('p');
        postContentEl.classList.add('content');
        postContentEl.innerText = content;
        post.appendChild(postContentEl);

        postsSection.prepend(post);
        postContent.value = ''; // Clear post content
    });
});
