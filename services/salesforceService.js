import jsforce from 'jsforce';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import axios from 'axios';
import { salesforce } from '../config/authConfig.js';

let conn;

const authenticateSalesforce = async () => {
    try {
        const privateKeyPath = 'C:\\Convergenc3 Files\\LIV\\backend\\liv-backend\\liv-backend\\private.key';
        const certificatePath = 'C:\\Convergenc3 Files\\LIV\\backend\\liv-backend\\liv-backend\\server.crt';
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        const certificate = fs.readFileSync(certificatePath, 'utf8');

        const token = jwt.sign(
            {
                iss: salesforce.clientId,
                sub: salesforce.username,
                aud: salesforce.loginUrl,
                exp: Math.floor(Date.now() / 1000) + (60 * 10) // 10 minutes expiration
            },
            privateKey,
            { algorithm: 'RS256', header: { x5c: certificate } }
        );

        conn = new jsforce.Connection({
            instanceUrl: salesforce.instanceUrl,
            loginUrl: salesforce.loginUrl
        });

        await conn.authorize(token);
        console.log('JWT authentication successful:', conn.accessToken);
    } catch (error) {
        throw new Error('Salesforce authentication failed: ' + error.message);
    }
};

const salesforceRequest = async (method, endpoint, data = null) => {
    try {
        if (!conn || !conn.accessToken) {
            console.log('No connection reached, authenticating...');
            await authenticateSalesforce();
        }

        const url = `${conn.instanceUrl}${endpoint}`;
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
            const url = `${conn.instanceUrl}${endpoint}`;
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
