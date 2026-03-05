# HTTPS Setup Guide

## For Development (Self-Signed Certificates)

### Step 1: Generate Self-Signed Certificate

On Windows, ensure OpenSSL is installed. If you have Git Bash, OpenSSL should be available.

```bash
cd server
node generate-cert.js
```

This will generate:
- `certs/private-key.pem`
- `certs/certificate.pem`

### Step 2: Start the Server

```bash
npm start
```

The server will now run on `https://localhost:3000` with WSS WebSocket support.

### Step 3: Trust the Certificate (Optional, for local development)

#### On Windows:
1. Open `certs/certificate.pem` in a text editor
2. Copy the entire content (between BEGIN and END)
3. Open "Manage user certificates" (certmgr.msc)
4. Navigate to Trusted Root Certification Authorities > Certificates
5. Right-click, Import, and paste the certificate content

#### On macOS:
```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/certificate.pem
```

#### On Linux:
```bash
sudo cp certs/certificate.pem /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

## For Production (Let's Encrypt - FREE)

### Option 1: Using Let's Encrypt with Certbot

1. Deploy your app on a server with a domain name
2. Install Certbot:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```
3. Generate certificate:
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```
4. Update server.js paths to:
   ```
   /etc/letsencrypt/live/yourdomain.com/privkey.pem
   /etc/letsencrypt/live/yourdomain.com/fullchain.pem
   ```
5. Set up auto-renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

### Option 2: Cloud Hosting with Built-in HTTPS

Many cloud providers handle HTTPS automatically:
- **Heroku** - Free HTTPS with *.herokuapp.com domain
- **Render** - Free SSL certificate
- **Vercel** - Free SSL certificate
- **AWS** - AWS Certificate Manager (free)
- **DigitalOcean App Platform** - Free SSL certificate

## Troubleshooting

### Certificate Error in Browser
- Self-signed certificates will show a warning in production
- This is normal for development
- In production, use Let's Encrypt (free and trusted)

### iOS Safari Still Not Working
1. Ensure using HTTPS (not HTTP)
2. Use a valid, trusted certificate (not self-signed on iOS)
3. iOS requires certificate to be issued by a trusted CA
4. For development on iOS, deploy to a service with proper SSL

### OpenSSL not found on Windows
Install Git for Windows or OpenSSL separately:
- Download from https://slproweb.com/products/Win32OpenSSL.html
- Choose "Light" version (smallest)
- Add to PATH during installation

## Environment Variables

To disable HTTPS (not recommended for production):
```bash
USE_HTTPS=false npm start
```

## Security Notes

- Self-signed certificates are NOT trusted by browsers/mobile devices
- Never use self-signed certificates in production
- Always use trusted certificates (Let's Encrypt, Comodo, etc.)
- Keep private keys secure
- Don't commit private keys to version control
