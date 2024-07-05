import {} from "../services/shopifyService.js";

export const updateUsername = async (req, res, next) => {

  try {
    const response = await updateName(userId);

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

export const getCustomerOrders = async (req, res, next) => {
  const { customerId } = req.params;

  if (!customerId) {
    return res.status(400).json({ error: "Customer ID is required" });
  }

  try {
    const orders = await getOrdersByCustomerId(customerId);
    console.log("orders");
    console.log(orders);
    const filteredOrders = orders.filter(order => order.fulfillment_status === 'fulfilled' || 'null' && order.financial_status === 'pending');
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