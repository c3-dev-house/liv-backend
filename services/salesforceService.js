import jsforce from 'jsforce';
import axios from 'axios';
import { salesforce } from '../config/authConfig.js';

let conn;

const authenticate = async () => {
    console.log('authenticate triggered');
    //console.log(salesforce.authFlow);
  try {
    if (salesforce.authFlow === 'username-password') {
        console.log('authflow username-password');
      conn = new jsforce.Connection({
        loginUrl: salesforce.loginUrl
      });
      //console.log('Before login:', conn);
      await conn.login(salesforce.username, salesforce.password + salesforce.token);
      //console.log('After login:', conn);
    } else if (salesforce.authFlow === 'oauth') {
      conn = new jsforce.Connection({
        oauth2: {
          clientId: salesforce.clientId,
          clientSecret: salesforce.clientSecret,
          redirectUri: salesforce.redirectUri
        }
      });
      const response = await axios.post('https://login.salesforce.com/services/oauth2/token', {
        grant_type: 'refresh_token',
        client_id: salesforce.clientId,
        client_secret: salesforce.clientSecret,
        refresh_token: salesforce.refreshToken,
      });
      conn.accessToken = response.data.access_token;
      conn.refreshToken = response.data.refresh_token; // Update the refresh token if it changes
      conn.instanceUrl = response.data.instance_url; // Update instance URL if provided
    }
  } catch (error) {
    throw new Error('Salesforce authentication failed: ' + error.message);
  }
};

const salesforceRequest = async (method, endpoint, data = null) => {
  if (!conn || !conn.accessToken) {
    console.log('no conn reached');
    await authenticate();
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
      await authenticate();
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

const getOwnedProducts = async (beneficiaryId) => {
  console.log('getOwnedProducts salesforce service triggered');
  if (!conn || !conn.accessToken) {
    await authenticate();
  }

  const query = `SELECT Id, Name, Bundle_Items__c, Clothing_Bundle_Category__c, Bundle_Price__c, Standard__c, Sales_Status__c, Order_ID__c, Selling_Price__c, Profit__c, Sell_Date__c, Beneficiary__c, General_Customer__c, Warehouse_Location__c FROM Clothing_Bundles__c WHERE Beneficiary__c = '${beneficiaryId}'`;
  const records = await conn.query(query);
  return records.records;
};

const getProductItems = async (bundleId) => {
  console.log('getProductItems salesforce service triggered');
  if (!conn || !conn.accessToken) {
    await authenticate();
  }
  const query = `SELECT Id, Name, Quantity__c, Description__c, Sales_Price__c, CreatedDate, Clothing_Bundles_Id__c  FROM Clothing_Items__c WHERE Clothing_Bundles_Id__c = '${bundleId}'`;
  const records = await conn.query(query);
  console.log('records');
  console.log(records);
  return records.records;
}


export { authenticate, salesforceRequest, getOwnedProducts, getProductItems};
