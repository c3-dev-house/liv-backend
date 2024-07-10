import axios from "axios";
import { shopify } from "../config/authConfig.js";
import moment from 'moment';

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

export const getBeneficiaryProducts = async (customerId) => {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  try {
    const purchases = await getOrdersByCustomerId(customerId);
    console.log("purchases", purchases);

    const filteredSales = purchases.filter(sale => sale.financial_status === 'paid');
    const transformedSales = filteredSales.map(sale => {
      const formattedDate = new Date(sale.created_at).toLocaleDateString('en-GB');
      const formattedTime = new Date(sale.created_at).toLocaleTimeString('en-GB');

      return {
        id: sale.id,
        date: formattedDate,
        time: formattedTime,
        items: sale.line_items.length,
        products: sale.line_items.map(item => ({
          id: item.product_id,
          title: item.title,
          price: parseFloat(item.price),
          createdAt: formattedDate,
        })),
        location: sale.line_items.length > 0 ? sale.line_items[0].vendor : 'N/A',
      };
    });
    console.log("transformedSales:", transformedSales);

    const productsArray = (transformedSales || [])
      .flatMap(order =>
        order.products.map(product => ({
          id: product.id,
          date: order.date,
          time: order.time,
          title: product.title,
          price: product.price,
          location:order.location
        }))
      );

    console.log("Products Array:", productsArray);
    console.log("First Product", transformedSales[0].products[0]);
    console.log("Products Array:", productsArray);
    console.log("Products", transformedSales[0].products[0])
    return productsArray;

  } catch (error) {
    console.error('Error fetching customer purchases:', error.message);
    throw error;
  }
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
  console.log("updateProductStatus reached, productId:", productId);
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

//todo implement fulfillment services - done


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


export const getOrdersByCustomerId = async (customerId) => {
  console.log("getOrdersByCustomerId service triggered");
  const response = await axios.get(
    `https://${shopify.storeUrl}/admin/api/2024-04/orders.json`,
    {
      headers: shopifyHeaders,
      params: {
        customer_id: customerId,
        fields: "id,customer,id,fulfillment_status,financial_status,line_items,created_at",
      },
    }
  );
  console.log("response", response.data.orders);
  return response.data.orders;
};

export const getOrderById = async (orderId) => {
  console.log("getOrderById triggered", orderId);
  const response = await axios.get(
    `https://${shopify.storeUrl}/admin/api/2024-04/orders/${orderId}.json`,
    {
      headers: shopifyHeaders,
    }
  );
  console.log("response", response.data.order);
  return response.data.order;
};

export const getOrdersByCustomerAndDateRange = async (customerId, startDate, endDate) => {
  const response = await axios.get(
    `https://${shopify.storeUrl}/admin/api/2024-04/orders.json`,
    {
      headers: shopifyHeaders,
      params: {
        customer_id: customerId,
        created_at_min: startDate.toISOString(),
        created_at_max: endDate.toISOString(),
        fields: "id,created_at,line_items",
      },
    }
  );
  return response.data.orders;
};

export const getWeeklyReservedQuantity = async (customerId) => {
  const startOfWeek = moment().startOf('week').toDate();
  const endOfWeek = moment().endOf('week').toDate();
  const orders = await getOrdersByCustomerAndDateRange(customerId, startOfWeek, endOfWeek);
  //console.log("number of orders: ", orders.length);

  let totalQuantity = 0;
  orders.forEach(order => {
    order.line_items.forEach(item => {
      totalQuantity += item.quantity;
    });
  });

  return totalQuantity;
};