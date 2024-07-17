import { salesforceRequest } from '../services/salesforceService.js';

export const deleteSalesItem = async (req, res, next) => {
  const recordId = req.params.recordId;

  try {
    // Define the endpoint to update the existing record in Salesforce
    const endpoint = `/services/data/v52.0/sobjects/Clothing_Items__c/${recordId}`;

    // Send the PUT request to Salesforce
    // console.log('Sending request to Salesforce to delete the item...');
    await salesforceRequest('DELETE', endpoint); // Note: Use 'PATCH' for partial updates in Salesforce
    // console.log('Item deleted successfully in Salesforce');

    // Send a success response back to the client
    res.status(200).json({
      message: 'Item deleted successfully',
      itemId: recordId
    });
  } catch (error) {
    console.error('Error deleted item in Salesforce:', error.message);
    next(error);
  }
};
