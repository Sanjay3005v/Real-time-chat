const socket = io();
let username = "";
let avatarData = localStorage.getItem('avatarData') || '';
let replyingTo = null; // Holds the ID of the message being replied to

// --- UI Elements ---
document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('settingsBtn');
    const themeToggle = document.getElementById('themeToggle');
    const emojiBtn = document.getElementById('emojiBtn');
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');

    settingsBtn.addEventListener('click', () => showUserSettingsModal());
    themeToggle.addEventListener('click', toggleTheme);
    emojiBtn.addEventListener('click', toggleEmojiPicker);
    sendBtn.addEventListener('click', sendMessage);

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';
    });
    
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    document.addEventListener('click', (e) => {
        const emojiPicker = document.getElementById('emojiPicker');
        if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
            emojiPicker.style.display = 'none';
        }
    });

    initialize();
});

// --- Initialization ---
function initialize() {
    loadTheme();
    populateEmojiPicker();

    username = localStorage.getItem('username') || '';
    avatarData = localStorage.getItem('avatarData') || '';
    document.getElementById('chatTitle').textContent = `Welcome, ${username || 'Guest'}`;

    if (!username) {
        showUserSettingsModal(true); // isFirstTime setup
    } else {
        updateUserPanel();
        socket.emit("new user", { id: socket.id, username, avatar: avatarData });
    }
}

// --- User & Avatar --- 
function updateUserPanel() {
    document.getElementById('userPanelName').textContent = username;
    updateAvatar('userPanelAvatar', 'userPanelAvatarPlaceholder', avatarData, username);
}

function updateAvatar(imgId, placeholderId, data, name) {
    const img = document.getElementById(imgId);
    const placeholder = document.getElementById(placeholderId);
    if (data) {
        img.src = data;
        img.style.display = 'block';
        placeholder.style.display = 'none';
    } else {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
        placeholder.textContent = (name || '?').charAt(0).toUpperCase();
    }
}

function showUserSettingsModal(isFirstTime = false) {
    const modal = document.getElementById('userSettingsModal');
    const nameInput = document.getElementById('modalNameInput');
    const avatarInput = document.getElementById('modalAvatarInput');
    const uploadBtn = document.getElementById('modalAvatarUploadBtn');
    const removeBtn = document.getElementById('removeAvatarBtn');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const closeBtn = modal.querySelector('.close-btn');

    nameInput.value = username;
    let modalAvatarData = avatarData;
    updateAvatar('modalAvatarImage', 'modalAvatarPlaceholder', modalAvatarData, username);

    uploadBtn.onclick = () => avatarInput.click();
    avatarInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            modalAvatarData = event.target.result;
            updateAvatar('modalAvatarImage', 'modalAvatarPlaceholder', modalAvatarData, nameInput.value);
        };
        reader.readAsDataURL(file);
    };

    removeBtn.onclick = () => {
        modalAvatarData = '';
        updateAvatar('modalAvatarImage', 'modalAvatarPlaceholder', modalAvatarData, nameInput.value);
    };

    confirmBtn.onclick = () => {
        const newName = nameInput.value.trim();
        if (!newName) {
            nameInput.focus();
            nameInput.style.borderColor = 'red';
            return;
        }

        username = newName;
        avatarData = modalAvatarData;

        localStorage.setItem('username', username);
        localStorage.setItem('avatarData', avatarData);

        updateUserPanel();
        socket.emit("edit user", { username, avatar: avatarData });
        document.getElementById('chatTitle').textContent = `Welcome, ${username}`;
        modal.style.display = 'none';
    };

    closeBtn.onclick = () => { if (!isFirstTime) modal.style.display = 'none'; };
    modal.style.display = 'flex';
}

// --- Socket Listeners ---
socket.on("user list", (users) => {
    const userList = document.getElementById("userList");
    userList.innerHTML = "";
    users.forEach(user => {
        const li = document.createElement("li");
        li.id = `user-${user.id}`;
        const avatarPlaceholder = `<div class="avatar-placeholder">${user.username.charAt(0).toUpperCase()}</div>`;
        const avatar = user.avatar ? `<img class="avatar" src="${user.avatar}" alt="${user.username}'s avatar">` : avatarPlaceholder;
        li.innerHTML = `<div class="avatar-container">${avatar}</div> <span>${user.username}</span>`;
        userList.appendChild(li);
    });
});

socket.on("user updated", (user) => {
    const userListItem = document.getElementById(`user-${user.id}`);
    if (userListItem) {
        const avatarPlaceholder = `<div class="avatar-placeholder">${user.username.charAt(0).toUpperCase()}</div>`;
        const avatar = user.avatar ? `<img class="avatar" src="${user.avatar}" alt="${user.username}'s avatar">` : avatarPlaceholder;
        userListItem.innerHTML = `<div class="avatar-container">${avatar}</div> <span>${user.username}</span>`;
    }
});

socket.on("chat message", (msg) => {
    const messages = document.getElementById("messages");
    const li = document.createElement("li");
    li.id = `msg-${msg.id}`;

    const avatarPlaceholder = `<div class="avatar-placeholder">${msg.username.charAt(0).toUpperCase()}</div>`;
    const avatarEl = msg.avatar ? `<img class="avatar" src="${msg.avatar}" alt="Avatar">` : avatarPlaceholder;
    const time = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const textWithEmojis = twemoji.parse(msg.text, { folder: 'svg', ext: '.svg' });

    let replyHTML = '';
    if (msg.replyTo) {
        const repliedMsg = document.getElementById(`msg-${msg.replyTo.id}`);
        if (repliedMsg) {
            const originalUsername = msg.replyTo.username;
            const originalText = msg.replyTo.text;
            replyHTML = `<div class="reply-content"><span class="username">${originalUsername}</span>: ${originalText}</div>`;
        }
    }

    li.innerHTML = `
        <div class="message-avatar">${avatarEl}</div>
        <div class="message-content">
            ${replyHTML}
            <div>
                <span class="username">${msg.username}</span>
                <span class="timestamp">${time}</span>
            </div>
            <div class="message-text">${textWithEmojis}</div>
        </div>
        <button class="icon-btn reply-btn" onclick="setReplyTo('${msg.id}', '${msg.username}', '${msg.text}')"><i class="material-icons">reply</i></button>`;

    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
});


// --- Messaging ---
function sendMessage() {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();
    if (text) {
        socket.emit("chat message", { text, replyTo: replyingTo });
        input.value = "";
        input.style.height = 'auto'; // Reset height
        cancelReply(); // Clear reply state
    }
}

function setReplyTo(id, user, text) {
    replyingTo = { id, username: user, text };
    const banner = document.getElementById('replying-to-banner');
    banner.innerHTML = `Replying to <strong>${user}</strong>: ${text.substring(0, 50)}... <span class="cancel-reply" onclick="cancelReply()">&times;</span>`;
    banner.style.display = 'flex';
    document.getElementById('messageInput').focus();
}

function cancelReply() {
    replyingTo = null;
    const banner = document.getElementById('replying-to-banner');
    banner.style.display = 'none';
}

// --- Emoji Picker ---
function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.style.display = picker.style.display === 'none' ? 'grid' : 'none';
}

function populateEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    const emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾','👋','🤚','🖐','✋','🖖','👌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦵','🦿','🦶','👂','🦻','👃','🧠','🦷','🦴','👀','👁','👅','👄','💋','🩸'];
    picker.innerHTML = ''; // Clear previous emojis
    emojis.forEach(emoji => {
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'emoji';
        emojiSpan.innerHTML = twemoji.parse(emoji, { folder: 'svg', ext: '.svg' });
        emojiSpan.onclick = () => {
            const input = document.getElementById('messageInput');
            input.value += emoji;
            input.focus();
        };
        picker.appendChild(emojiSpan);
    });
}

// --- Theming ---
function toggleTheme() {
    const newTheme = document.body.classList.contains('light-theme') ? 'dark-theme' : 'light-theme';
    setTheme(newTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark-theme";
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.body.className = theme;
    const themeIcon = document.querySelector('#themeToggle i');
    themeIcon.textContent = theme === "light-theme" ? "brightness_7" : "brightness_4";
    localStorage.setItem("theme", theme);
}
