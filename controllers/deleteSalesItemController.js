import { salesforceRequest } from '../services/salesforceService.js';
export const deleteSalesItem = async (req, res, next) => {
  const recordId = req.params.recordId;

  try {
    // Define the query to get the clothing bundle ID and related sales prices
    const getItemQuery = `
      SELECT Clothing_Bundles_Id__c, Sales_Price__c
      FROM Clothing_Items__c
      WHERE Id = '${recordId}'
    `;
    console.log('Fetching clothing bundle ID and sales price for the item');

    // Send the GET request to Salesforce to retrieve the bundle ID
    const itemResponse = await salesforceRequest('GET', `/services/data/v52.0/query/?q=${encodeURIComponent(getItemQuery)}`);
    
    if (itemResponse.records.length === 0) {
      throw new Error(`No item found with ID: ${recordId}`);
    }

    const itemData = itemResponse.records[0];
    const clothingBundleId = itemData.Clothing_Bundles_Id__c;
    console.log(`Clothing Bundle ID retrieved: ${clothingBundleId}`);

    // Update the isDeleted__c field to true and set Sales_Price__c to 0
    const updateEndpoint = `/services/data/v52.0/sobjects/Clothing_Items__c/${recordId}`;
    const updatePayload = { isDeleted__c: true, Sales_Price__c: 0,Quantity__c:0 };
    console.log(`Marking item with ID: ${recordId} as deleted and setting Sales_Price__c to 0`);

    await salesforceRequest('PATCH', updateEndpoint, updatePayload);
    console.log(`Item with ID: ${recordId} marked as deleted and Sales_Price__c set to 0 successfully`);

    // Define the endpoint to delete the existing record in Salesforce
    const deleteEndpoint = `/services/data/v52.0/sobjects/Clothing_Items__c/${recordId}`;
    console.log(`Deleting item with ID: ${recordId} from Salesforce`);

    // Send the DELETE request to Salesforce
    await salesforceRequest('DELETE', deleteEndpoint);
    console.log(`Item with ID: ${recordId} deleted successfully`);

    // Send a success response back to the client
    res.status(200).json({
      message: 'Item marked as deleted, sales price set to 0, and deleted successfully',
      itemId: recordId
    });
  } catch (error) {
    console.error('Error processing request:', error.message);
    next(error);
  }
};



