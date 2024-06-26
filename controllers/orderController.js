import {
  createDraftOrder,
  completeDraftOrder,
  cancelOrder,
  updateProductStatus,
  createFulfillment,
  getFulfillmentOrders
} from "../services/shopifyService.js";

//todo test all order controllers

export const createOrder = async (req, res, next) => {
  const { userId, variantIds, productIds } = req.body;
  console.log("createOrder controller triggered");
  console.log("req.body:");
  console.log(req.body);
  //const userId ='7024877994031' //todo find test user id, grace shopify id.
  //const variantIds = ['42995584892975']; //42998797860911 //42998633070639 female teen clothing R200

  if (
    !userId ||
    !variantIds ||
    !Array.isArray(variantIds) ||
    variantIds.length === 0 ||
    !Array.isArray(productIds) ||
    productIds.length === 0
  ) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  try {
    // Create the draft order for draftOrderResponse
    const draftOrderData = {
      draft_order: {
        line_items: variantIds.map((variantId) => ({
          variant_id: variantId,
          quantity: 1,
        })),
        customer: {
          id: userId,
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
