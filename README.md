# Real-time Chat Application

A real-time chat application built using **Node.js**, **Express**, and **Socket.IO**.  
This application allows multiple users to connect and chat in real-time, with features like dynamic name and avatar selection, typing indicators, and message replies.

---

## ✨ Features

- **Real-time Messaging**: Instant message delivery to all connected users.  
- **User Management**:
  - New users can enter a username and choose an avatar from a list of defaults or upload their own image.  
  - Users can edit their name and avatar at any time.  
  - A list of all online users is displayed and updated in real time.  
- **System Notifications**: Get notified when a user joins, leaves, or changes their name.  
- **Typing Indicator**: A *“user is typing…”* message is broadcast to others when a user is composing a message.  
- **Message Replies**: Users can reply to specific messages, which are then quoted in their response.  
- **Emoji Bar**: A sidebar with a selection of emojis that can be easily added to messages.  
- **Theme Toggle**: Switch between dark and light themes.  
- **Responsive Design**: Optimized for both desktop and mobile devices.  

---

## 🛠️ Technology Stack

- **Backend**: Node.js and Express  
- **Real-time Communication**: Socket.IO  
- **Frontend**: HTML, CSS, and JavaScript  

---

## ⚡ Installation and Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd real-time-chat
    ```
2. **Install dependencies**
   ```bash
    npm install
   ```
3. **Run the server**
   ```bash
    npm start
   ```

The server will start on http://localhost:3000
.
Open this URL in your web browser to use the chat application.

📂 Project Structure
```
real-time-chat/
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── public/
    ├── index.html
    └── style.css
```


The .gitignore file is configured to ignore the node_modules directory.
