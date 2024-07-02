import jsforce from 'jsforce';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import axios from 'axios';
import { salesforce } from '../config/authConfig.js';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

let conn;

const authenticateSalesforce = async () => {
    console.log("Authenticating");
    // Get the directory path of the current module file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Construct the path to your private key file
    const privateKeyPath = path.resolve(__dirname, '../private.key');
    
    try {
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

        const payload = {
            iss: salesforce.clientId,
            sub: salesforce.username,
            aud: salesforce.loginUrl,
            exp: Math.floor(Date.now() / 1000) + (60 * 10) // 10 minutes expiration
        };

        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

        const response = await axios.post(`${salesforce.loginUrl}/services/oauth2/token`, null, {
            params: {
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: token
            }
        });

        const accessToken = response.data.access_token;
        // console.log(`Access Token: ${accessToken}`);

        conn = new jsforce.Connection({
            instanceUrl: salesforce.instanceUrl,
            accessToken: accessToken
        });
        console.log('JWT authentication successful:')
        // console.log('JWT authentication successful:', conn.accessToken);
    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data, null, 2) : error.message;
        throw new Error('Salesforce authentication failed: ' + errorMsg);
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
            const errorMsg = error.response ? JSON.stringify(error.response.data, null, 2) : error.message;
            throw new Error('Salesforce request failed: ' + errorMsg);
        }
    }
};

const getOwnedProducts = async (beneficiaryId) => {
  console.log('getOwnedProducts salesforce service triggered');
  if (!conn || !conn.accessToken) {
    await authenticateSalesforce();
  }

  const query = `SELECT Id, Name, Bundle_Items__c, Clothing_Bundle_Category__c, Bundle_Price__c, Standard__c, Sales_Status__c, Order_ID__c, Selling_Price__c, Profit__c, Sell_Date__c, Beneficiary__c, General_Customer__c, Warehouse_Location__c FROM Clothing_Bundles__c WHERE Beneficiary__c = '${beneficiaryId}'`;
  const records = await conn.query(query);
  return records.records;
};

const getClothingBundleId = async (productId) => {
    console.log('getClothingBundleId salesforce service triggered');
    if (!conn || !conn.accessToken) {
      await authenticateSalesforce();
    }
    const query = `SELECT Id, Name,Shopify_Product_Id__c  FROM Clothing_Bundles__c WHERE Shopify_Product_Id__c = '${productId}'`;
    const records = await conn.query(query);
    console.log('clothing bundles');
    console.log(records.records[0].Id);
    return records.records[0].Id;
  }

const getProductItems = async (bundleId) => {
  console.log('getProductItems salesforce service triggered');
  if (!conn || !conn.accessToken) {
    await authenticateSalesforce();
  }
  const query = `SELECT Id, Name, Quantity__c, Description__c, Sales_Price__c, CreatedDate, Clothing_Bundles_Id__c,Shopify_Product_Id__c  FROM Clothing_Items__c WHERE Shopify_Product_Id__c = '${bundleId}'`;
  const records = await conn.query(query);
  console.log('records');
  console.log(records);
  return records.records;
}

const deleteAllClothingItems = async () => {
    console.log('Deleting all clothing items from Salesforce...');
    if (!conn || !conn.accessToken) {
        await authenticateSalesforce();
    }

    try {
        // Fetch all records to delete
        const records = await conn.sobject('Clothing_Items__c').find({}, ['Id']);
        const itemIds = records.map(record => record.Id);

        // Ensure itemIds is an array
        if (!Array.isArray(itemIds)) {
            throw new Error('Item IDs must be provided as an array.');
        }

        // Delete records in batches
        const batchSize = 200; // Adjust batch size based on Salesforce limits
        const promises = [];
        for (let i = 0; i < itemIds.length; i += batchSize) {
            const batchIds = itemIds.slice(i, i + batchSize);
            promises.push(conn.sobject('Clothing_Items__c').destroy(batchIds));
        }

        await Promise.all(promises);
        console.log('All clothing items deleted successfully.');
    } catch (error) {
        console.error('Error deleting clothing items:', error);
        throw error;
    }
};

const deleteAllClothingBundles = async () => {
    console.log('Deleting all clothing bundles from Salesforce...');
    if (!conn || !conn.accessToken) {
        await authenticateSalesforce();
    }

    try {
        // Fetch all records to delete
        const records = await conn.sobject('Clothing_Bundles__c').find({}, ['Id']);
        const bundleIds = records.map(record => record.Id);

        // Ensure bundleIds is an array
        if (!Array.isArray(bundleIds)) {
            throw new Error('Bundle IDs must be provided as an array.');
        }

        // Delete records in batches
        const batchSize = 200; // Adjust batch size based on Salesforce limits
        const promises = [];
        for (let i = 0; i < bundleIds.length; i += batchSize) {
            const batchIds = bundleIds.slice(i, i + batchSize);
            promises.push(conn.sobject('Clothing_Bundles__c').destroy(batchIds));
        }

        await Promise.all(promises);
        console.log('All clothing bundles deleted successfully.');
    } catch (error) {
        console.error('Error deleting clothing bundles:', error);
        throw error;
    }
};





export { authenticateSalesforce, salesforceRequest, getOwnedProducts, getProductItems,deleteAllClothingItems,deleteAllClothingBundles,getClothingBundleId};
