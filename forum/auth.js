document.getElementById("auth-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const turnstileResponse = document.querySelector(".cf-turnstile-response").value;
    if (!turnstileResponse) {
        alert("Please complete the CAPTCHA");
        return;
    }

    // Simulate authentication (In a real application, verify credentials and CAPTCHA on the server)
    if (username && password) {
        localStorage.setItem("username", username);
        window.location.href = "index.html";
    } else {
        alert("Invalid login credentials");
    }
});
