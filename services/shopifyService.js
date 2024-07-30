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

export const getCategorizedProducts = async (vendor,productType) => {
  console.log("getCategorizedProducts service triggered");
  const response = await axios.get(
    `https://${shopify.storeUrl}/admin/api/2024-04/products.json`,
    {
      headers: shopifyHeaders,
      params: {
        vendor: vendor,
        product_type: productType,
        fields: "id,title,product_type,variants,vendor,body_html,created_at,status",
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
  console.log('Customer Id,', customerId)
  try {
    const purchases = await getOrdersByCustomerId(customerId);
    console.log("purchases", purchases);

    const filteredSales = purchases.filter(sale => sale.financial_status === 'paid' && (sale.fulfillment_status === 'fulfilled' || sale.fulfillment_status === null));
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

    const productsPromises = (transformedSales || []).flatMap(order =>
      order.products.map(async product => {
        const productDetails = await getProductDetailsById(product.id);
        return {
          id: product.id,
          date: order.date,
          time: order.time,
          title: product.title,
          price: product.price,
          location: order.location,
          body_html: productDetails.body_html 
        };
      })
    );

    const productsArray = await Promise.all(productsPromises);
    console.log("productsArray:", productsArray);
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
  console.log('Cancel Order,',response.data)
  console.log('Cancel OrderId,',orderId)
  return response.data;
};

export const orderPaid = async (orderId) => {
  try {
    const response = await axios.post(
      `https://${shopify.storeUrl}/admin/api/2024-04/orders/${orderId}/transactions.json`,
      {
        transaction: {
          kind: 'capture', // or 'sale' depending on your needs
          status: 'success',
        },
      },
      {
        headers: shopifyHeaders,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking order as paid:', error);
    throw error;
  }
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
        fields: "id,customer,id,fulfillment_status,financial_status,line_items,created_at,cancel_reason",
        status:'any'
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


export const registerApplicant = async (formData) => {
  // Define the createCustomer function within registerApplicant
  const inputData = formData.formData;
  console.log('formData here',inputData.email)
  const createCustomer = async () => {
    const note = `
      is_reseller_applicant: on|
      id_number: ${inputData.idNumber}|
      dob: ${inputData.birthDate}|
      gender: ${inputData.gender}|
      referred_by: ${inputData.referredBy}|
      mobile_number: ${inputData.mobileNumber}|
      alternative_number: ${inputData.alternativeNumber}|
      city: ${inputData.city}|
      street_address: ${inputData.streetAddress}|
      province: ${inputData.province}|
      race: ${inputData.race}|
      children_under_18: ${inputData.numberOfChildren}|
      disabled: ${inputData.disabilities}|
      criminal_record: ${inputData.criminalRecord}|
      related_to_liv_employee: ${inputData.relatedToLIV}|
    `;

    const customerData = {
      customer: {
        email: inputData.email,
        first_name: inputData.name,
        last_name: inputData.surname,
        note: note.trim(),
      }
    };
    console.log('customerData',customerData)
    try {
      // Make the API request to Shopify
      const response = await axios.post(`https://${shopify.storeUrl}/admin/api/2024-04/customers.json`, customerData, {
        headers: shopifyHeaders,
      });
      console.log("Customer Created:", response.data);
      return response.data; // Return the response data
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error; // Re-throw the error for the caller to handle
    }
  };

  // Call createCustomer and return its result
  return createCustomer();
};

export const getProductDetailsById = async (productId) => {
  try {
    const response = await axios.get(
      `https://${shopify.storeUrl}/admin/api/2024-04/products/${productId}.json`,
      {
        headers: shopifyHeaders,
        params: {
          fields: 'id,title,body_html',
        },
      }
    );
    return response.data.product;
  } catch (error) {
    console.error('Error fetching product details:', error.message);
    throw error;
  }
};