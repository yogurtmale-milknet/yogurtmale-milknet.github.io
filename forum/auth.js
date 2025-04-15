function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '{}');
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function register() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!username || !password) return alert("Fill in all fields");

  const token = document.querySelector('[name="cf-turnstile-response"]')?.value;
  if (!token) return alert("Please complete the CAPTCHA");

  const users = getUsers();
  if (users[username]) return alert("Username already taken");

  users[username] = { password };
  saveUsers(users);
  localStorage.setItem('loggedInUser', username);
  window.location.href = "index.html";
}

function login() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  const users = getUsers();
  if (!users[username]) return alert("User does not exist");
  if (users[username].password !== password) return alert("Incorrect password");

  localStorage.setItem('loggedInUser', username);
  window.location.href = "index.html";
}
