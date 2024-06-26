export const salesforce = {
  clientId: process.env.SALESFORCE_CLIENT_ID,
  clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
  username: process.env.SALESFORCE_USERNAME,
  password: process.env.SALESFORCE_PASSWORD,
  token: process.env.SALESFORCE_SECURITY_TOKEN,
  redirectUri: process.env.SALESFORCE_REDIRECT_URI,
  instanceUrl: process.env.SALESFORCE_INSTANCE_URL,
  loginUrl: process.env.SALESFORCE_LOGIN_URL,
  authFlow: process.env.SALESFORCE_AUTH_FLOW, // 'username-password' or 'oauth' - set in .env
};

export const shopify = {
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  storeUrl: process.env.SHOPIFY_STORE_URL,
  storeLocationId: process.env.SHOPIFY_STORE_LOCATION_ID
};
