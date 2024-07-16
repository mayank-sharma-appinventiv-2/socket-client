import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:4000", {
  autoConnect: false
});

function App() {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [userList, setUserList] = useState<string[]>([]);
  const [privateMessages, setPrivateMessages] = useState<{
    [key: string]: string[];
  }>({});
  useEffect(() => {
    socket.connect();
    socket.on('connect', () => {
      console.log('Connected to server with socket ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Listen for user list updates
    socket.on("userList", (users: string[]) => {
      setUserList(users);
    });

    // Listen for private messages
    socket.on(
      "privateMessage",
      ({ from, msg }: { from: string; msg: string }) => {
        console.log("from, msg", from, msg)
        alert(`message: ${msg} from : ${from}`)
        setPrivateMessages((prevPrivateMessages) => ({
          ...prevPrivateMessages,
          [from]: [...(prevPrivateMessages[from] || []), msg],
        }));
      }
    );

    // Listen for incoming messages
    socket.on("message", (msg: string) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    // Clean up the effect
    return () => {
      socket.off("userList");
      socket.off("message");
      socket.off("privateMessage");
    };
  }, []);

  const sendMessage = () => {
    socket.emit("message", message);
    setMessage("");
  };

  const handleLogin = () => {
    socket.emit("login", username);
    setIsLoggedIn(true);
  };

  const sendPrivateMessage = (to: string) => {
    const msg = prompt(`Send a private message to ${to}`);
    if (msg) {
      socket.emit('privateMessage', { to, msg });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="App">
        <h1>Login</h1>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Socket.io Chat</h1>
      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
      <div>
        <h2>Users</h2>
        {userList.map((user, index) => (
          <div key={index}>
            {user}
            <button onClick={() => sendPrivateMessage(user)}>Send Private Message</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
