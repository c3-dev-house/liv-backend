import axios from 'axios';
import { shopify } from '../config/authConfig.js';

const shopifyHeaders = {
  'X-Shopify-Access-Token': shopify.accessToken,
  'Content-Type': 'application/json'
};

const getProducts = async (vendor) => {
    console.log('getProducts service triggered');
  const response = await axios.get(`https://${shopify.storeUrl}/admin/api/2024-04/products.json`, {
    headers: shopifyHeaders,
    params: {
      vendor: vendor,
      fields: 'id,title,variants,vendor,body_html,created_at,status'
    }
  });
  console.log('response',response.data.products);
  return response.data.products;
};

export { getProducts };
//fields: 'id,title,variants,vendor, body_html, created_at, status'