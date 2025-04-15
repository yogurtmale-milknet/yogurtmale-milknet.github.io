let threads = JSON.parse(localStorage.getItem('threads') || '[]');

function saveThreads() {
  localStorage.setItem('threads', JSON.stringify(threads));
}

function createThread() {
  const title = document.getElementById('thread-title').value;
  const content = document.getElementById('thread-content').value;
  const imageInput = document.getElementById('thread-image');

  const reader = new FileReader();
  reader.onload = () => {
    const thread = {
      id: Date.now(),
      title,
      posts: [{
        content,
        image: reader.result || '',
        date: new Date().toLocaleString()
      }]
    };
    threads.unshift(thread);
    saveThreads();
    renderThreads();
  };

  if (imageInput.files.length > 0) {
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    reader.onload(); // No image
  }

  document.getElementById('thread-title').value = '';
  document.getElementById('thread-content').value = '';
  document.getElementById('thread-image').value = '';
}

function replyToThread(threadId, content, imageFile) {
  const thread = threads.find(t => t.id === threadId);
  const reader = new FileReader();

  reader.onload = () => {
    thread.posts.push({
      content,
      image: reader.result || '',
      date: new Date().toLocaleString()
    });
    saveThreads();
    renderThreads();
  };

  if (imageFile) {
    reader.readAsDataURL(imageFile);
  } else {
    reader.onload();
  }
}

function renderThreads() {
  const container = document.getElementById('threads');
  container.innerHTML = '';

  threads.forEach(thread => {
    const threadDiv = document.createElement('div');
    threadDiv.className = 'thread';

    threadDiv.innerHTML = `<h3>${thread.title}</h3>`;

    thread.posts.forEach(post => {
      const postDiv = document.createElement('div');
      postDiv.className = 'reply';
      postDiv.innerHTML = `
        <p>${post.content}</p>
        ${post.image ? `<img src="${post.image}">` : ''}
        <small>${post.date}</small>
      `;
      threadDiv.appendChild(postDiv);
    });

    const replyBox = document.createElement('div');
    replyBox.className = 'emoji-wrap';
    replyBox.innerHTML = `
      <textarea placeholder="Write a reply..."></textarea><br>
      <input type="file" class="reply-image"><br>
      <button>Reply</button>
      <button class="emoji-button" data-target="reply-${thread.id}">😊</button>
    `;

    const textarea = replyBox.querySelector('textarea');
    textarea.id = `reply-${thread.id}`;

    replyBox.querySelector('button').onclick = () => {
      const text = textarea.value;
      const file = replyBox.querySelector('.reply-image').files[0];
      replyToThread(thread.id, text, file);
    };

    threadDiv.appendChild(replyBox);
    container.appendChild(threadDiv);
  });

  attachEmojiPickers();
}

function attachEmojiPickers() {
  const buttons = document.querySelectorAll('.emoji-button');
  buttons.forEach(button => {
    const picker = new EmojiButton({ theme: 'auto' });
    const targetId = button.getAttribute('data-target');

    picker.on('emoji', emoji => {
      const textarea = document.getElementById(targetId);
      textarea.value += emoji;
    });

    button.addEventListener('click', () => {
      picker.togglePicker(button);
    });
  });
}

renderThreads();
