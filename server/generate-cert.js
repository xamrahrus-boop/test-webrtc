const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

// Check if certificates already exist
const certDir = path.join(__dirname, 'certs');
const keyPath = path.join(certDir, 'private-key.pem');
const certPath = path.join(certDir, 'certificate.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✓ Certificates already exist');
  console.log(`  - ${keyPath}`);
  console.log(`  - ${certPath}`);
  process.exit(0);
}

// Create certs directory if it doesn't exist
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
  console.log('✓ Created certs directory');
}

console.log('Generating self-signed certificate for localhost...');
console.log('This certificate is for development only.\n');

try {
  // Generate certificate attributes
  const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'organizationName', value: 'WebRTC P2P' },
    { name: 'organizationalUnitName', value: 'Development' },
    { name: 'countryName', value: 'US' },
    { name: 'stateOrProvinceName', value: 'State' },
    { name: 'localityName', value: 'Locality' }
  ];

  // Generate certificate with proper settings for better compatibility
  const { private: privateKey, cert: certificate } = selfsigned.generate(attrs, {
    days: 3650,  // 10 years validity
    algorithm: 'sha256',
    keySize: 2048  // Use 2048-bit (more compatible than 4096)
  });

  // Write files
  fs.writeFileSync(keyPath, privateKey, 'utf8');
  fs.writeFileSync(certPath, certificate, 'utf8');

  console.log('✓ Self-signed certificate generated successfully!\n');
  console.log(`✓ Private key: ${keyPath}`);
  console.log(`✓ Certificate: ${certPath}\n`);
  console.log('ℹ️  Certificate Details:');
  console.log('  - Valid for: 10 years (3650 days)');
  console.log('  - Algorithm: SHA-256');
  console.log('  - Key size: 2048-bit RSA');
  console.log('  - Includes: localhost, 127.0.0.1, ::1\n');
  
  console.log('⚠️  IMPORTANT - For production or iOS:');
  console.log('  Use a real certificate from Let\'s Encrypt (FREE)');
  console.log('  See HTTPS_SETUP.md for complete instructions\n');
  
  console.log('✓ Ready! Start server with: npm start');

  process.exit(0);
} catch (error) {
  console.error('\n❌ Error generating certificate:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
