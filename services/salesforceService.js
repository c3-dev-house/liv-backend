import jsforce from "jsforce";
import jwt from "jsonwebtoken";
import fs from "fs";
import axios from "axios";
import { salesforce } from "../config/authConfig.js";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import bcrypt from "bcrypt";

let conn;
//plan to call this f() to set conn.accesstoken to temp one for doing login.
const setSalesforceConnection = (accessToken, instanceUrl) => {
  conn = new jsforce.Connection({
    instanceUrl: instanceUrl,
    accessToken: accessToken,
  });
};

//used to get username-password auth object
const authenticateLoginSalesforce = async () => {
  try {
    const response = await axios.post(
      `${salesforce.loginUrl}/services/oauth2/token`,
      null,
      {
        params: {
          grant_type: "password",
          client_id: salesforce.clientId,
          client_secret: salesforce.clientSecret,
          username: salesforce.username,
          password: salesforce.password + salesforce.securityToken, // Salesforce password concatenated with security token
        },
      }
    );

    const accessToken = response.data.access_token;
    const instanceUrl = response.data.instance_url;

    console.log("access token: ", accessToken);
    console.log("access token: ", instanceUrl);

    console.log("Username-password authentication successful");
    return { accessToken, instanceUrl };
  } catch (error) {
    const errorMsg = error.response
      ? JSON.stringify(error.response.data, null, 2)
      : error.message;
    throw new Error("Salesforce login failed: " + errorMsg);
  }
};
const verifyCredentials = async (username, password) => {
    const staticUsername = process.env.UMTHOMBO_ADMIN_USERNAME;
    const staticPassword = process.env.UMTHOMBO_ADMIN_PASSWORD;
    console.log('username',username,'password',password);
    return username === staticUsername && password === staticPassword;
  };

  const authenticateAdminLogin = async (username, password) => {
    try {
      const credentialsValid = await verifyCredentials(username, password);
  
      if (credentialsValid) {
        return { success: true, needsPasswordReset: false };
      } else {
        return { success: false };
      }
    } catch (error) {
      console.error('Error during admin login:', error);
      throw error; // Handle and throw specific errors if needed
    }
  };
  

const authenticateSalesforce = async () => {
  // Get the directory path of the current module file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Construct the path to your private key file
  const privateKeyPath = path.resolve(__dirname, "../private.key");

  try {
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");

    const payload = {
      iss: salesforce.clientId,
      sub: salesforce.username,
      aud: salesforce.loginUrl,
      exp: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes expiration
    };

    const token = jwt.sign(payload, privateKey, { algorithm: "RS256" });

    const response = await axios.post(
      `${salesforce.loginUrl}/services/oauth2/token`,
      null,
      {
        params: {
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: token,
        },
      }
    );

    const accessToken = response.data.access_token;
    console.log(`Access Token: ${accessToken}`);

    conn = new jsforce.Connection({
      instanceUrl: salesforce.instanceUrl,
      accessToken: accessToken,
    });

    console.log("JWT authentication successful:", conn.accessToken);
    return { token,payload};
  } catch (error) {
    const errorMsg = error.response
      ? JSON.stringify(error.response.data, null, 2)
      : error.message;
    throw new Error("Salesforce authentication failed: " + errorMsg);
  }
};

const salesforceRequest = async (method, endpoint, data = null) => {
  try {
    if (!conn || !conn.accessToken) {
      console.log("No connection reached, authenticating...");
      await authenticateSalesforce();
    }

    const url = `${conn.instanceUrl}${endpoint}`;
    const response = await axios({
      method,
      url,
      headers: {
        Authorization: `Bearer ${conn.accessToken}`,
        "Content-Type": "application/json",
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
          Authorization: `Bearer ${conn.accessToken}`,
          "Content-Type": "application/json",
        },
        data,
      });
      return response.data;
    } else {
      const errorMsg = error.response
        ? JSON.stringify(error.response.data, null, 2)
        : error.message;
      throw new Error("Salesforce request failed: " + errorMsg);
    }
  }
};
//funtion to fetch user details so that pw hashes can be compared,
//todo add dummy hash compare to check for first sign in. add needsPasswordReset
const getUserFromSalesforce = async (username, password) => {
  console.log("getUserFromSalesforce salesforce service triggered");
  if (!conn || !conn.accessToken) {
    const authenticateLoginSalesforceResponse =
      await authenticateLoginSalesforce();
    setSalesforceConnection(
      authenticateLoginSalesforceResponse.accessToken,
      authenticateLoginSalesforceResponse.instanceUrl
    );
  }
  try {
    const query = `SELECT Id, Username__c, Password_Hash__c, isPasswordReset__c, Shopify_Id__c FROM Beneficiary__c WHERE Username__c = '${username}'`;
    const response = await salesforceRequest(
      "GET",
      `/services/data/v50.0/query?q=${encodeURIComponent(query)}`
    );
    console.log("getUserFromSalesforce response:", response.records);
    if (response.records.length === 0) {
      return null;
    }

    const user = response.records[0];
    console.log("User found:", user);
    console.log(salesforce.dummyPasswordHash);

    // Compare provided password with stored hashed password or dummy password hash
    const isPasswordValid = await bcrypt.compare(
      password,
      user.Password_Hash__c
    );
    console.log("Password valid:", isPasswordValid);
    const needsPasswordReset = isPasswordValid && !user.isPasswordReset__c;
    if (!isPasswordValid) {
      return null;
    }

    // Check if the user is using the dummy password and hasn't reset it yet - removed, hash will be same even if dummy pw is supplied..
    //const needsPasswordReset = await bcrypt.compare(password, salesforce.dummyPasswordHash) && !user.isPasswordReset__c;
    //console.log("needsPasswordReset:", needsPasswordReset);
    return { ...user, needsPasswordReset };
  } catch (error) {
    throw new Error("Failed to fetch user from Salesforce: " + error.message);
  }
};

const getAllUserFromSalesforce = async () => {
    console.log("getAllUserFromSalesforce salesforce service triggered");
    if (!conn || !conn.accessToken) {
      const authenticateLoginSalesforceResponse =
        await authenticateLoginSalesforce();
      setSalesforceConnection(
        authenticateLoginSalesforceResponse.accessToken,
        authenticateLoginSalesforceResponse.instanceUrl
      );
    }
    try {
      const query = `SELECT Username__c,Shopify_Id__c FROM Beneficiary__c`;
      const response = await salesforceRequest(
        "GET",
        `/services/data/v50.0/query?q=${encodeURIComponent(query)}`
      );
      console.log("getAllUserFromSalesforce response:", response.records);
      if (response.records.length === 0) {
        return null;
      }
  
      const usersArray = response.records
            .map((user) => ({
                Username__c: user.Username__c,
                Shopify_Id__c: user.Shopify_Id__c
            }))
            .filter(user => user.Username__c !== null);
        
        console.log("Users found:", usersArray);

        return usersArray;
    } catch (error) {
      throw new Error("Failed to fetch user from Salesforce: " + error.message);
    }
  };

// Function to check if a user exists in Salesforce by username - used for forget password controller
const isUserInSalesforce = async (username) => {
  console.log("isUserInSalesforce salesforce service triggered");
  if (!conn || !conn.accessToken) {
    const authenticateLoginSalesforceResponse =
      await authenticateLoginSalesforce();
    setSalesforceConnection(
      authenticateLoginSalesforceResponse.accessToken,
      authenticateLoginSalesforceResponse.instanceUrl
    );
  }
  try {
    const query = `SELECT Id, Username__c FROM Beneficiary__c WHERE Username__c = '${username}'`;
    const response = await salesforceRequest(
      "GET",
      `/services/data/v50.0/query?q=${encodeURIComponent(query)}`
    );

    return response.records.length > 0 ? response.records[0] : null;
  } catch (error) {
    throw new Error("Failed to check user in Salesforce: " + error.message);
  }
};

const updateSalesforcePassword = async (userId, hashedPassword) => {
  if (!conn || !conn.accessToken) {
    await authenticateSalesforce(); //decide on this or
  }
  console.log("updateSalesforcePassword salesforce service triggered");
  try {
    const endpoint = `/services/data/v50.0/sobjects/Beneficiary__c/${userId}`;
    const data = { Password_Hash__c: hashedPassword, isPasswordReset__c: true };
    const response = await salesforceRequest("PATCH", endpoint, data);
    return response;
  } catch (error) {
    throw new Error(
      "Failed to update user password in Salesforce: " + error.message
    );
  }
};
// Reusable function to authenticate user + get user details after resetting pw
const authenticateUser = async (username, password) => {
  if (!conn || !conn.accessToken) {
    const authenticateLoginSalesforceResponse =
      await authenticateLoginSalesforce();
    setSalesforceConnection(
      authenticateLoginSalesforceResponse.accessToken,
      authenticateLoginSalesforceResponse.instanceUrl
    );
  }

  const user = await getUserFromSalesforce(username, password);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const { token } = await authenticateSalesforce();

  return { user, token };
};

/*
export const validateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, salesforce.clientSecret, (err, decoded) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to authenticate token' });
    }

    // If token is valid, return user details
    res.status(200).json({ message: 'Token is valid', user: decoded });
  });
};
*/

const getOwnedProducts = async (beneficiaryId) => {
  console.log("getOwnedProducts salesforce service triggered");
  if (!conn || !conn.accessToken) {
    await authenticateSalesforce();
  }

  const query = `SELECT Id, Name, Bundle_Items__c, Clothing_Bundle_Category__c, Bundle_Price__c, Standard__c, Sales_Status__c, Order_ID__c, Selling_Price__c, Profit__c, Sell_Date__c, Beneficiary__c, General_Customer__c, Warehouse_Location__c FROM Clothing_Bundles__c WHERE Beneficiary__c = '${beneficiaryId}'`;
  const records = await conn.query(query);
  return records.records;
};

const getClothingBundleId = async (productId) => {
  console.log("getClothingBundleId salesforce service triggered");
  if (!conn || !conn.accessToken) {
    await authenticateSalesforce();
  }
  const query = `SELECT Id, Name,Shopify_Product_Id__c  FROM Clothing_Bundles__c WHERE Shopify_Product_Id__c = '${productId}'`;
  const records = await conn.query(query);
  console.log("clothing bundles");
  console.log(records.records[0].Id);
  return records.records[0].Id;
};

const getProductItems = async (bundleId) => {
  console.log("getProductItems salesforce service triggered");
  if (!conn || !conn.accessToken) {
    await authenticateSalesforce();
  }
  const query = `SELECT Id, Name, Quantity__c, Description__c, Sales_Price__c, CreatedDate, Clothing_Bundles_Id__c,Shopify_Product_Id__c  FROM Clothing_Items__c WHERE Shopify_Product_Id__c = '${bundleId}'`;
  const records = await conn.query(query);
  console.log("records");
  console.log(records);
  return records.records;
};

const deleteAllClothingItems = async () => {
  console.log("Deleting all clothing items from Salesforce...");
  if (!conn || !conn.accessToken) {
    await authenticateSalesforce();
  }

  try {
    // Fetch all records to delete
    const records = await conn.sobject("Clothing_Items__c").find({}, ["Id"]);
    const itemIds = records.map((record) => record.Id);

    // Ensure itemIds is an array
    if (!Array.isArray(itemIds)) {
      throw new Error("Item IDs must be provided as an array.");
    }

    // Delete records in batches
    const batchSize = 200; // Adjust batch size based on Salesforce limits
    const promises = [];
    for (let i = 0; i < itemIds.length; i += batchSize) {
      const batchIds = itemIds.slice(i, i + batchSize);
      promises.push(conn.sobject("Clothing_Items__c").destroy(batchIds));
    }

    await Promise.all(promises);
    console.log("All clothing items deleted successfully.");
  } catch (error) {
    console.error("Error deleting clothing items:", error);
    throw error;
  }
};

const deleteAllClothingBundles = async () => {
  console.log("Deleting all clothing bundles from Salesforce...");
  if (!conn || !conn.accessToken) {
    await authenticateSalesforce();
  }

  try {
    // Fetch all records to delete
    const records = await conn.sobject("Clothing_Bundles__c").find({}, ["Id"]);
    const bundleIds = records.map((record) => record.Id);

    // Ensure bundleIds is an array
    if (!Array.isArray(bundleIds)) {
      throw new Error("Bundle IDs must be provided as an array.");
    }

    // Delete records in batches
    const batchSize = 200; // Adjust batch size based on Salesforce limits
    const promises = [];
    for (let i = 0; i < bundleIds.length; i += batchSize) {
      const batchIds = bundleIds.slice(i, i + batchSize);
      promises.push(conn.sobject("Clothing_Bundles__c").destroy(batchIds));
    }

    await Promise.all(promises);
    console.log("All clothing bundles deleted successfully.");
  } catch (error) {
    console.error("Error deleting clothing bundles:", error);
    throw error;
  }
};

const getBeneficiaryDetails = async (userId) => {
    console.log('getBeneficiaryDetails salesforce service triggered');
    if (!conn || !conn.accessToken) {
      await authenticateSalesforce();
    }
    const query = `SELECT Username__c, About_me__c, Street_Address__c FROM Beneficiary__c WHERE Id = '${userId}'`;
    const profileRecord = await conn.query(query);
    console.log('records');
    console.log(profileRecord.records);
    return profileRecord.records;
  }
export {
  authenticateSalesforce,
  salesforceRequest,
  getOwnedProducts,
  getProductItems,
  deleteAllClothingItems,
  deleteAllClothingBundles,
  getClothingBundleId,
  authenticateLoginSalesforce,
  setSalesforceConnection,
  getUserFromSalesforce,
  updateSalesforcePassword,
  isUserInSalesforce,
  authenticateUser,
  getBeneficiaryDetails,
  getAllUserFromSalesforce,
  authenticateAdminLogin
};