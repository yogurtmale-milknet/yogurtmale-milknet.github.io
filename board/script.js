document.addEventListener('DOMContentLoaded', function () {
    const BACKEND_URL = 'https://milk.servemp3.com/board-backend/'; // Replace with your actual URL

    function generateRandomUsername() {
        const randomNum = Math.floor(Math.random() * 1000);
        return `milkenjoyer[${randomNum.toString().padStart(3, '0')}]`;
    }

    let username = localStorage.getItem('username');
    if (!username) {
        username = generateRandomUsername(); // Temporary
    }
    document.getElementById('username').innerText = username;

    function renderPosts(posts) {
        const postsSection = document.getElementById('posts-section');
        postsSection.innerHTML = '';
        posts.forEach(post => {
            const postDiv = document.createElement('div');
            postDiv.classList.add('post');

            const postUsername = document.createElement('p');
            postUsername.classList.add('username');
            postUsername.innerText = post.username;

            const postContent = document.createElement('p');
            postContent.classList.add('content');
            postContent.innerText = post.content;

            postDiv.appendChild(postUsername);
            postDiv.appendChild(postContent);
            postsSection.appendChild(postDiv);
        });
    }

    function loadPosts() {
        fetch(`${BACKEND_URL}/posts`)
            .then(res => res.json())
            .then(data => renderPosts(data))
            .catch(err => console.error('Failed to load posts', err));
    }

    loadPosts();

    const postForm = document.getElementById('post-form');
    const postContent = document.getElementById('post-content');

    postForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const content = postContent.value.trim();
        if (!content) return;

        const newPost = {
            username,
            content,
            timestamp: new Date().toISOString()
        };

        fetch(`${BACKEND_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newPost)
        })
            .then(res => res.json())
            .then(() => {
                if (!localStorage.getItem('username')) {
                    localStorage.setItem('username', username);
                }
                loadPosts();
                postContent.value = '';
            })
            .catch(err => console.error('Failed to post', err));
    });
});
