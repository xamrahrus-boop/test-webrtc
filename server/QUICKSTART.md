# 🚀 Quick Start Guide

## Starting the Application

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Generate HTTPS Certificates (One-time)
```bash
npm run generate-cert
```

Output:
```
✓ Created certs directory
✓ Self-signed certificate generated successfully!
✓ Private key: certs/private-key.pem
✓ Certificate: certs/certificate.pem
```

### 3. Start the Server
```bash
npm start
```

Output:
```
✓ Using HTTPS with self-signed certificate
✓ Signaling server running on https://localhost:3000
✓ WebSocket server ready on wss://localhost:3000
✓ Clients: 0
```

## 4. Access the Application

### Desktop/Laptop
1. Open browser and go to: **https://localhost:3000**
2. Browser may warn about self-signed certificate:
   - Click "Advanced" or "Details"
   - Click "Proceed to localhost" or similar
   - This is normal and safe for development

### From Other Devices on Same Network
1. Find your computer's IP address (e.g., 192.168.1.100)
2. Go to: **https://192.168.1.100:3000**
3. Accept the certificate warning
4. The app will work exactly the same

### From iPhone/iPad
1. Find your computer's IP address
2. In Safari, go to: **https://YOUR_IP:3000**
3. Tap the address bar and go to the page
4. Tap "Continue" when warned about certificate
5. Allow camera and microphone access in browser settings
6. Enable media devices and start calling!

## Using the App

1. **Setup Media:**
   - Select camera from dropdown
   - Select microphone from dropdown
   - Click "✓ Enable Camera and Microphone"
   - Grant permissions when browser asks

2. **Make a Call:**
   - Wait for other users to appear in "Available Peers"
   - OR copy another user's Peer ID and paste into the "Connect to Peer" field
   - Click "Call" or "Позвонить"

3. **Accept Call:**
   - Click "Accept" when someone calls you
   - Video connection will establish automatically

4. **During Call:**
   - 🎤 Toggle microphone on/off
   - 📹 Toggle camera on/off
   - 🖥️ Share your screen
   - ☎️ End call when done

## Troubleshooting

### "Certificate Error" or "Not Secure" Warning
- **This is normal!** Self-signed certificates always show warnings
- Click "Advanced" and "Proceed" - it's safe
- For production, deploy with a real certificate from Let's Encrypt

### Camera/Microphone Not Working
1. Check browser permissions (Settings > Apps > Camera/Microphone)
2. Make sure no other app is using the camera
3. Try: inspect console (F12) for error messages

### Can't Connect Between Devices
- Both must be on same WiFi network
- Use HTTPS (not HTTP)
- Check that firewall allows port 3000
- Verify both can reach the server at: https://YOUR_IP:3000

### iOS Safari Issues
- Use HTTPS (required by iOS)
- Go to Settings > Safari > Camera & Microphone = Ask
- Clear Safari cache if it still doesn't work
- Restart Safari completely
- For production: use proper SSL certificate (not self-signed)

## For Production Deployment

See [HTTPS_SETUP.md](../HTTPS_SETUP.md) for:
- Using proper SSL certificates (Let's Encrypt - FREE)
- Deploying to cloud services
- iOS/Safari compatibility requirements
- Setting up auto-renewal of certificates

## Environment Variables

```bash
# If you want to disable HTTPS (not recommended)
USE_HTTPS=false npm start

# Use different port
PORT=8080 npm start
```

## File Structure

```
server/
  ├── server.js          # Main server with HTTPS support
  ├── generate-cert.js   # SSL certificate generator
  ├── package.json       # Dependencies
  └── certs/            # Generated SSL certificates (don't share!)
      ├── private-key.pem
      └── certificate.pem

../client/
  ├── index.html        # Web page
  ├── app.js           # WebRTC logic
  └── style.css        # Styling
```

## Security Notes

- Self-signed certificates are NOT trusted by browsers
- Only use self-signed certificates for development/testing
- Never deploy to production without proper certificates
- Don't share your private key (`certs/private-key.pem`)

## Need Help?

1. Check browser console (F12 > Console tab) for error messages
2. Look at server console for connection logs
3. See [README.md](../README.md) for detailed documentation
4. See [HTTPS_SETUP.md](../HTTPS_SETUP.md) for SSL setup details
