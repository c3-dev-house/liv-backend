import {
  createDraftOrder,
  completeDraftOrder,
  cancelOrder,
  updateProductStatus,
  createFulfillment,
  getFulfillmentOrders,
  getOrdersByCustomerId,
  getOrderById,
  orderPaid,
  getWeeklyReservedQuantity
  
} from "../services/shopifyService.js";

//todo test all order controllers

export const createOrder = async (req, res, next) => {
  const { customerId, variantIds, productIds } = req.body;
  const WEEKLY_LIMIT = 10;
  console.log("createOrder controller triggered");
  console.log("req.body:");
  console.log(req.body);
  //const customerId ='7024877994031' //todo find test user id, grace shopify id.
  //const variantIds = ['42995584892975']; //42998797860911 //42998633070639 female teen clothing R200

  if (
    !customerId ||
    !variantIds ||
    !Array.isArray(variantIds) ||
    variantIds.length === 0 ||
    !Array.isArray(productIds) ||
    productIds.length === 0
  ) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  //todo: check if reservations for week has reached it's limit. return amount of bundles that can still be reserved - need to test. tested - works



  try {
    const currentReservedQuantity = await getWeeklyReservedQuantity(customerId);
    const currentOrderQuantity = variantIds.length;
    console.log("currently reserved historic:", currentReservedQuantity);
    console.log("currently ordered:", currentOrderQuantity);

    if (currentReservedQuantity + currentOrderQuantity > WEEKLY_LIMIT) {
      const remainingQuantity = WEEKLY_LIMIT - currentReservedQuantity;
      return res.status(400).json({
        error: "Weekly reservation limit exceeded",
        remainingQuantity: Math.max(remainingQuantity, 0)
      });
    }

    // Create the draft order for draftOrderResponse
    const draftOrderData = {
      draft_order: {
        line_items: variantIds.map((variantId) => ({
          variant_id: variantId,
          quantity: 1,
        })),
        customer: {
          id: customerId,
        }
      },
    };
    console.log(draftOrderData);

    //todo: create draft and completed order - done - works

    console.log("before draft order response");
    // Make a request to Shopify to create the draft order
    const draftOrderResponse = await createDraftOrder(draftOrderData);
   
    // Complete the draft order
    const completeOrderResponse = await completeDraftOrder(
      draftOrderResponse.draft_order.id
    );
  

    //todo update fulfilment status - done - works
    const orderId = completeOrderResponse.draft_order.order_id;
   

    const fulfillmentOrders = await getFulfillmentOrders(orderId);
    if (!fulfillmentOrders || fulfillmentOrders.length === 0) {
      throw new Error('No fulfillment orders found for the order');
    }

    const fulfillmentOrderId = fulfillmentOrders[0].id;
   

    const fulfillment = await createFulfillment(fulfillmentOrderId);
    console.log('fulfillment: ', fulfillment);


    //todo update product status to inactive (for both variants too if required) - done - works

    for (const productId of productIds) {
      console.log("update product status after order: ", productId);
      await updateProductStatus(productId, "draft");
    }

    res.json({
      success: true,
      order: completeOrderResponse.draft_order,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelUserOrder = async (req, res, next) => {
  const { orderId, productIds  } = req.body;
  console.log(productIds);

  if (!orderId) {
    return res.status(400).json({ error: "Order ID is required" });
  }
  //todo update cancelation reason on order, cancel_reason: 'customer' - The customer canceled the order.
  try {
    const response = await cancelOrder(orderId);

    for (const productId of productIds) {
      console.log("update product status after cancellation: ", productId);
      await updateProductStatus(productId, "active");
    }

    res.json({
      success: true,
      order: response.order,
    });
  } catch (error) {
    next(error);
  }
};

export const markUserOrderAsPaid = async (req, res, next) => {
  const { orderId, productIds  } = req.body;
  console.log(productIds);

  if (!orderId) {
    return res.status(400).json({ error: "Order ID is required" });
  }
  //todo update cancelation reason on order, cancel_reason: 'customer' - The customer canceled the order.
  try {
    const response = await orderPaid(orderId);

    for (const productId of productIds) {
      console.log("update product status after payment: ", productId);
      await updateProductStatus(productId, "archived");
    }

    res.json({
      success: true,
      order: response.order,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerOrders = async (req, res, next) => {
  const { customerId } = req.params;

  if (!customerId) {
    return res.status(400).json({ error: "Customer ID is required" });
  }

  try {
    const orders = await getOrdersByCustomerId(customerId);
    console.log("orders");
    console.log(orders);
    const filteredOrders = orders.filter(order => (order.fulfillment_status === 'fulfilled' || order.fulfillment_status === null) && order.financial_status === 'pending');
    const transformedOrders = filteredOrders.map(order => {
      const formattedDate = new Date(order.created_at).toLocaleDateString('en-GB');
      const formattedTime = new Date(order.created_at).toLocaleTimeString('en-GB');
      
      return {
        id: order.id,
        date:formattedDate,
        time: formattedTime,
        items: order.line_items.length,
        products: order.line_items.map(item => {
          
          return {
            id: item.product_id,
            title: item.title,
            price: parseFloat(item.price),
            createdAt: formattedDate
          };
        }),
        location: order.line_items.length > 0 ? order.line_items[0].vendor : 'N/A'
      };
    });


    res.json({
      success: true,
      orders: transformedOrders,
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error.message);
    next(error);
  }
};

export const getCustomerOrderById = async (req, res, next) => {
  const { orderId } = req.params;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    const order = await getOrderById(orderId); 
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const transformedOrder = {
      id: order.id,
      date: new Date(order.created_at).toLocaleDateString('en-GB'),
      time: new Date(order.created_at).toLocaleTimeString('en-GB'),
      items: order.line_items.length,
      products: order.line_items.map(item => ({
        id: item.product_id,
        title: item.title,
        price: parseFloat(item.price),
        createdAt: new Date(order.created_at).toLocaleDateString('en-GB')

      })),
      location: order.line_items.length > 0 ? order.line_items[0].vendor : 'N/A'
    };
    console.log("transformedOrder");
    console.log(transformedOrder);
    res.json({ success: true, order: transformedOrder });
  } catch (error) {
    console.error('Error fetching order:', error.message);
    next(error);
  }
};