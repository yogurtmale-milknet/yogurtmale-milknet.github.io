document.addEventListener("DOMContentLoaded", () => {
    const postContent = document.getElementById("post-content");
    const postSubmit = document.getElementById("post-submit");
    const postList = document.getElementById("post-list");
    const authLinks = document.getElementById("auth-links");

    let currentUser = null; // Store the current user info

    // Check if user is logged in
    const checkUser = () => {
        // Simulate user authentication for now (In real case, check from the server)
        const user = localStorage.getItem("username");
        if (user) {
            currentUser = user;
            postContent.disabled = false;
            postSubmit.disabled = false;
            authLinks.innerHTML = `<span>Logged in as ${user}</span> | <a href="auth.html" onclick="logout()">Logout</a>`;
        } else {
            postContent.disabled = true;
            postSubmit.disabled = true;
        }
    };

    // Handle post creation
    postSubmit.addEventListener("click", () => {
        const content = postContent.value.trim();
        if (content) {
            const newPost = document.createElement("div");
            newPost.classList.add("post");
            newPost.innerHTML = `
                <h3>${currentUser}</h3>
                <p>${content}</p>
            `;
            postList.prepend(newPost);
            postContent.value = '';
        }
    });

    // Logout functionality
    const logout = () => {
        localStorage.removeItem("username");
        checkUser();
    };

    checkUser();
});
