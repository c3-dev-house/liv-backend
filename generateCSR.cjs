const forge = require('node-forge');

// Generate a key pair
const keys = forge.pki.rsa.generateKeyPair(2048);

// Create a CSR
const csr = forge.pki.createCertificationRequest();
csr.publicKey = keys.publicKey;
csr.setSubject([{ name: 'commonName', value: 'testCertificate.com' }]);
csr.sign(keys.privateKey);

// Print CSR PEM format
console.log(forge.pki.certificationRequestToPem(csr));
