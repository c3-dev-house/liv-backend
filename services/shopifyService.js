import axios from "axios";
import { shopify } from "../config/authConfig.js";

const shopifyHeaders = {
  "X-Shopify-Access-Token": shopify.accessToken,
  "Content-Type": "application/json",
};

export const getProducts = async (vendor) => {
  console.log("getProducts service triggered");
  const response = await axios.get(
    `https://${shopify.storeUrl}/admin/api/2024-04/products.json`,
    {
      headers: shopifyHeaders,
      params: {
        vendor: vendor,
        fields: "id,title,variants,vendor,body_html,created_at,status",
      },
    }
  );
  console.log("response", response.data.products);
  return response.data.products;
};

export const createDraftOrder = async (data) => {
  console.log("create draft order triggered");
  const response = await axios.post(
    `https://${shopify.storeUrl}/admin/api/2024-04/draft_orders.json`,
    data,
    {
      headers: shopifyHeaders,
    }
  );
  console.log("response");
  console.log(response.data);
  return response.data;
};

export const completeDraftOrder = async (draftOrderId) => {
  console.log("complete draft order triggered");
  const response = await axios.put(
    `https://${shopify.storeUrl}/admin/api/2024-04/draft_orders/${draftOrderId}/complete.json?payment_pending=true`,
    {},
    {
      headers: shopifyHeaders,
    }
  );
  console.log("response");
  console.log(response.data);
  return response.data;
};

export const cancelOrder = async (orderId) => {
  const response = await axios.post(
    `https://${shopify.storeUrl}/admin/api/2024-04/orders/${orderId}/cancel.json`,
    {
      cancel_reason: "customer"
    },
    {
      headers: shopifyHeaders,
    }
  );
  return response.data;
};

export const updateProductStatus = async (productId, status) => {
  console.log("updateProductStatus reached");
  const response = await axios.put(
    `https://${shopify.storeUrl}/admin/api/2024-04/products/${productId}.json`,
    {
      product: {
        id: productId,
        status: status,
      },
    },
    {
      headers: shopifyHeaders,
    }
  );
  console.log("response");
  console.log(response.data);
  return response.data;
};

//todo implement fulfillment services


export const createFulfillment = async (
  fulfillmentOrderId
) => {
  console.log("createFulfillment triggered");

  const url = `https://${shopify.storeUrl}/admin/api/2024-04/fulfillments.json`;
  const data = {
    fulfillment: {
      line_items_by_fulfillment_order: [
        {
          fulfillment_order_id: fulfillmentOrderId,
        },
      ],
    },
  };

  const response = await axios.post(url, data, {
    headers: shopifyHeaders,
  });

  console.log("Fulfillment response:", response.data);
  return response.data;
};

export const getFulfillmentOrders = async (orderId) => {
  console.log('getFulfillmentOrders triggered', orderId);
  const response = await axios.get(
    `https://${shopify.storeUrl}/admin/api/2024-04/orders/${orderId}/fulfillment_orders.json`,
    {
      headers: shopifyHeaders,
    }
  );
  console.log('response');
  console.log(response.data.fulfillment_orders);
  return response.data.fulfillment_orders;
};



