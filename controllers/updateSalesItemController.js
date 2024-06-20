import { salesforceRequest } from '../services/salesforceService.js';

export const updateSalesItem = async (req, res, next) => {
  const recordId = req.params.recordId;
  const { description, quantity, salesPrice } = req.body; // Extract fields from request body

  try {
    // Construct the payload
    const updatedItem = {
      Description__c: description,
      Quantity__c: quantity,
      Sales_Price__c: salesPrice
    };

    // Define the endpoint to update the existing record in Salesforce
    const endpoint = `/services/data/v52.0/sobjects/Clothing_Items__c/${recordId}`;

    // Send the PUT request to Salesforce
    console.log('Sending request to Salesforce to update the item...');
    await salesforceRequest('PATCH', endpoint, updatedItem); // Note: Use 'PATCH' for partial updates in Salesforce
    console.log('Item updated successfully in Salesforce');

    // Send a success response back to the client
    res.status(200).json({
      message: 'Item updated successfully',
      itemId: recordId
    });
  } catch (error) {
    console.error('Error updating item in Salesforce:', error.message);
    next(error);
  }
};
