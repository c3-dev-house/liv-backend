import { salesforceRequest } from '../services/salesforceService.js';

export const addSalesItem = async (req, res, next) => {
  const clothingBundleId = req.params.clothingBundleId;
  const { description, quantity, salesPrice } = req.body; // Extract fields from request body

  try {
    // Construct the payload
    const newItem = {
      Description__c: description,
      Quantity__c: quantity,
      Sales_Price__c: salesPrice,
      Clothing_Bundles_Id__c: clothingBundleId
    };

    // Define the endpoint to create a new record in Salesforce
    const endpoint = '/services/data/v52.0/sobjects/Clothing_Items__c';

    // Send the POST request to Salesforce
    // console.log('Sending request to Salesforce to add a new item...');
    const data = await salesforceRequest('POST', endpoint, newItem);
    // console.log('Received data from Salesforce:', data);

    // Send a success response back to the client
    res.status(201).json({
      message: 'Item added successfully',
      itemId: data.id
    });
  } catch (error) {
    console.error('Error adding item to Salesforce:', error.message);
    next(error);
  }
};
