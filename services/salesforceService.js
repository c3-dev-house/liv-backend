import jsforce from 'jsforce';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { salesforce } from '../config/authConfig.js';

let conn;

const authenticateSalesforce = async () => {
    console.log('authenticate triggered');
    // const __dirname = path.dirname(fileURLToPath(import.meta.url));
    try {
        if (salesforce.authFlow === 'jwt') {
          const privateKeyPath = 'C:\\Convergenc3 Files\\LIV\\backend\\liv-backend\\liv-backend\\certificates\\private.key';
          const certificatePath = 'C:\\Convergenc3 Files\\LIV\\backend\\liv-backend\\liv-backend\\certificates\\testKey.crt';

            const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
            const certificate = fs.readFileSync(certificatePath, 'utf8');

            const token = jwt.sign(
                {
                    iss: salesforce.clientId,
                    sub: salesforce.username,
                    aud: salesforce.loginUrl,
                    exp: Math.floor(Date.now() / 1000) + (60 * 3) // 3 minutes expiration
                },
                privateKey,
                { algorithm: 'RS256', header: { x5c: certificate } }
            );
            console.log(token);

            conn = new jsforce.Connection({
                instanceUrl: salesforce.instanceUrl
            });

            await conn.authorize(token);
            console.log('JWT authentication successful:', conn.accessToken);
        } else {
            throw new Error('Unsupported authentication flow');
        }
    } catch (error) {
        throw new Error('Salesforce authentication failed: ' + error.message);
    }
};

const salesforceRequest = async (method, endpoint, data = null) => {
    if (!conn || !conn.accessToken) {
        console.log('No connection reached, authenticating...');
        await authenticateSalesforce();
    }

    try {
        const instanceUrl = conn.instanceUrl || salesforce.instanceUrl;
        console.log('Instance URL:', instanceUrl);
        if (!instanceUrl) {
            throw new Error('Instance URL is not available.');
        }

        const url = `${instanceUrl}${endpoint}`;
        const response = await axios({
            method,
            url,
            headers: {
                'Authorization': `Bearer ${conn.accessToken}`,
                'Content-Type': 'application/json'
            },
            data,
        });

        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            // Re-authenticate if access token expired
            await authenticateSalesforce();
            // Retry the request
            const instanceUrl = conn.instanceUrl || salesforce.instanceUrl;
            if (!instanceUrl) {
                throw new Error('Instance URL is not available.');
            }

            const url = `${instanceUrl}${endpoint}`;
            const response = await axios({
                method,
                url,
                headers: {
                    'Authorization': `Bearer ${conn.accessToken}`,
                    'Content-Type': 'application/json'
                },
                data,
            });
            return response.data;
        } else {
            throw new Error('Salesforce request failed: ' + error.message);
        }
    }
};

export { authenticateSalesforce, salesforceRequest };
