# P2P WebRTC Video Call Application

A real-time peer-to-peer video call application built with WebRTC, Node.js/Express backend for signaling, and vanilla JavaScript frontend.

## Features

- **Real-time P2P Video/Audio Calls**: Direct peer-to-peer communication using WebRTC
- **Signaling Server**: Express.js backend with WebSocket for peer discovery and call negotiation
- **Responsive UI**: Modern, user-friendly interface that works on desktop and mobile
- **Audio/Video Controls**: Toggle camera and microphone during calls
- **Screen Sharing**: Share your screen with the peer
- **Peer Discovery**: Automatic discovery and listing of available peers
- **Direct Peer Connection**: Copy and share peer IDs for direct connections
- **STUN Servers**: Multiple STUN servers for NAT traversal

## Project Structure

```
├── server/
│   ├── package.json
│   └── server.js          # Express + WebSocket signaling server
├── client/
│   ├── index.html         # Main HTML interface
│   ├── style.css          # Styling
│   ├── app.js             # WebRTC client logic
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Modern web browser with WebRTC support (Chrome, Firefox, Edge, Safari)
- Webcam and microphone

## Installation

### 1. Install Backend Dependencies

```bash
cd server
npm install
```

### 2. Generate HTTPS Certificates (Required for production and iOS)

```bash
npm run generate-cert
```

This generates self-signed certificates for localhost. See [HTTPS_SETUP.md](HTTPS_SETUP.md) for production setup.

### 3. Start the Signaling Server

```bash
npm start
```

The server will start on `https://localhost:3000` with WebSocket Secure (WSS) support.

You'll see:
```
✓ Using HTTPS with self-signed certificate
✓ Signaling server running on https://localhost:3000
✓ WebSocket server ready on wss://localhost:3000
```

**Note:** Your browser may warn about the self-signed certificate. This is normal for development. Click "Advanced" and proceed to the site.

## Usage

### Single Machine Testing

1. Open your browser and navigate to `https://localhost:3000`
2. **Your browser will show a security warning** - this is normal for self-signed certificates
   - Click "Advanced" or "Details" (depending on browser)
   - Click "Proceed to localhost" or "Accept the Risk"
3. Open another browser tab or window (also at `https://localhost:3000`)
4. Both tabs will automatically get unique Peer IDs and show available cameras/microphones
5. **Enable Camera and Microphone:**
   - Select camera and microphone from the dropdown menus
   - Click "✓ Enable Camera and Microphone"
   - Grant browser permissions when prompted
6. In one tab, copy the peer ID from the other tab, paste it, and click "Call"
7. Accept the incoming call
8. Video call will be established!

### Multiple Machine Testing

1. Start the server on one machine (e.g., `192.168.1.100:3000`)
2. Connect from other machines using HTTPS: `https://192.168.1.100:3000`
3. Follow the same steps as single machine testing

**Important for remote access:** Self-signed certificates will show warnings. For production with iOS support, use a proper SSL certificate.

### Connection Methods

#### Method 1: Using Peer Discovery
1. Wait for other peers to appear in the "Available Peers" list
2. Click the "Call" button next to a peer

#### Method 2: Direct Peer ID
1. Get the peer ID of the person you want to call
2. Paste it in the "Connect to Peer" input field
3. Click the "Call" button

## Controls

| Button | Function |
|--------|----------|
| 🎤 Audio ON/OFF | Toggle microphone |
| 📹 Video ON/OFF | Toggle camera |
| 🖥️ Share | Share your screen |
| ☎️ End Call | Disconnect from peer |

## How It Works

### Architecture

```
┌─────────────┐         ┌─────────────┐
│  Browser 1  │         │  Browser 2  │
│  (WebRTC)   │◄───────►│  (WebRTC)   │
└─────────────┘         └─────────────┘
      │                       │
      └───────┬───────────────┘
              │
        ┌─────▼────┐
        │ Signaling│
        │ Server   │
        │(WebSocket)
        └──────────┘
```

### Signaling Flow

1. **Registration**: Each client connects to WebSocket and registers with a unique Peer ID
2. **Discovery**: Server maintains list of connected peers and broadcasts updates
3. **Offer/Answer**: WebRTC SDP offers and answers are exchanged through the server
4. **ICE Candidates**: ICE candidates required for connection traversal are relayed
5. **Direct Connection**: Once negotiated, video/audio flows directly between peers

## Development

### Project Dependencies

**Server:**
- `express`: Web framework
- `ws`: WebSocket library
- `selfsigned`: Generate self-signed SSL certificates

**Client:**
- Pure HTML/CSS/JavaScript (no framework dependencies)

### Scripts

In the `server/` directory:

```bash
npm start              # Start the HTTPS server
npm run dev           # Start with auto-reload (requires nodemon)
npm run generate-cert # Generate HTTPS certificates
```

### Building

The project is ready to run as-is. No build process is required.

### HTTPS/SSL Setup

#### For Development (Local Testing)
Self-signed certificates are already included. If needed, regenerate:
```bash
npm run generate-cert
```

#### For Production
See [HTTPS_SETUP.md](HTTPS_SETUP.md) for complete instructions on deploying with proper SSL certificates from Let's Encrypt.

## Troubleshooting

### iOS Safari (iPhone/iPad)
**Important**: iOS Safari requires HTTPS for camera and microphone access.

**For local testing:**
- Use localhost or local network IP
- iOS Safari may allow local access on certain conditions
- Make sure you're on the latest iOS version

**If camera/microphone won't work on iOS:**
1. Go to Settings > Safari > Camera & Microphone
2. Ensure permissions are set to "Ask" or "Allow"
3. Try accessing the app at `https://` instead of `http://`
4. Restart Safari completely
5. Clear Safari cache and cookies
6. Try a different WiFi network

**For production (iOS compatible):**
1. Deploy with HTTPS certificate
2. Use domain name (not IP address when possible)
3. Test on latest iOS Safari version

### Camera/Microphone Not Working
- Check browser permissions (Settings > Privacy)
- Ensure no other application is using the camera
- Try a different browser
- On iOS: See iOS Safari section above

### Can't Connect to Peer
- Both peers must be connected to the same signaling server
- Verify the peer ID is correct
- Check firewall settings
- Try using a TURN server for connections through restrictive networks
- For iOS: Ensure HTTPS is enabled

### WebSocket Connection Failed
- Verify the signaling server is running
- Check the server URL matches your setup
- For remote servers, ensure the port is accessible
- On iOS: WebSocket requires WSS (secure WebSocket) for HTTPS

### No Audio/Video Stream
- Grant permissions in browser settings
- Check that tracks are being added correctly
- Test with another WebRTC application to verify browser support
- For iOS: Ensure using HTTPS connection

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome  | ✓ Full  | Desktop & Android |
| Firefox | ✓ Full  | Desktop & Android |
| Safari  | ✓ Full  | Desktop (macOS), iOS requires HTTPS |
| Edge    | ✓ Full  | Desktop & Android |

## Configuration

### STUN Servers

The application uses multiple Google STUN servers. You can customize them in `app.js`:

```javascript
const RTCConfiguration = {
  iceServers: [
    { urls: 'stun:your-stun-server:3478' }
  ]
};
```

### Server Port

Default port is 3000. Change it in `server.js`:

```javascript
const PORT = process.env.PORT || 3000;
```

Or set via environment variable:
```bash
PORT=8080 npm start
```

## Security Notes

- This is a basic implementation for educational purposes
- In production, add authentication and encryption
- Use HTTPS/WSS instead of HTTP/WS
- Implement proper error handling and validation
- Consider adding encryption for signaling messages

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!
