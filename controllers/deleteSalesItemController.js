import { salesforceRequest } from '../services/salesforceService.js';
export const deleteSalesItem = async (req, res, next) => {
  const recordId = req.params.recordId;

  try {
    // Define the endpoint to delete the existing record in Salesforce
    const deleteEndpoint = `/services/data/v52.0/sobjects/Clothing_Items__c/${recordId}`;
    console.log(`Deleting item with ID: ${recordId} from Salesforce`);

    // Send the DELETE request to Salesforce
    await salesforceRequest('DELETE', deleteEndpoint);
    console.log(`Item with ID: ${recordId} deleted successfully`);

    // Define the query to get the clothing bundle ID and related sales prices
    const getItemQuery = `
      SELECT Clothing_Bundles__c, Sales_Price__c
      FROM Clothing_Items__c
      WHERE Id = '${recordId}'
    `;
    console.log('Fetching clothing bundle ID and sales price for the deleted item');

    // Send the GET request to Salesforce to retrieve the bundle ID
    const itemResponse = await salesforceRequest('GET', `/services/data/v52.0/query/?q=${encodeURIComponent(getItemQuery)}`);
    const itemData = itemResponse.records[0];
    const clothingBundleId = itemData.Clothing_Bundles__c;
    console.log(`Clothing Bundle ID retrieved: ${clothingBundleId}`);

    // Define the query to sum the sales prices of the related items
    const sumQuery = `
      SELECT SUM(Sales_Price__c) totalSalesPrice
      FROM Clothing_Items__c
      WHERE Clothing_Bundles__c = '${clothingBundleId}'
    `;
    console.log('Calculating total sales price for the clothing bundle');

    // Send the GET request to Salesforce to retrieve the total sales price
    const sumResponse = await salesforceRequest('GET', `/services/data/v52.0/query/?q=${encodeURIComponent(sumQuery)}`);
    const totalSalesPrice = sumResponse.records[0].totalSalesPrice;
    console.log(`Total sales price for bundle ${clothingBundleId} is: ${totalSalesPrice}`);

    // Define the query to get the selling price from the Clothing_Bundles__c object
    const bundleQuery = `
      SELECT Selling_Price__c
      FROM Clothing_Bundles__c
      WHERE Id = '${clothingBundleId}'
    `;
    console.log('Fetching selling price for the clothing bundle');

    // Send the GET request to Salesforce to retrieve the bundle selling price
    const bundleResponse = await salesforceRequest('GET', `/services/data/v52.0/query/?q=${encodeURIComponent(bundleQuery)}`);
    const bundleData = bundleResponse.records[0];
    const bundleSellingPrice = bundleData.Selling_Price__c;
    console.log(`Current selling price for bundle ${clothingBundleId} is: ${bundleSellingPrice}`);

    // Compare and update if necessary
    if (totalSalesPrice !== bundleSellingPrice) {
      console.log(`Updating selling price for bundle ${clothingBundleId} to match total sales price: ${totalSalesPrice}`);
      const updateEndpoint = `/services/data/v52.0/sobjects/Clothing_Bundles__c/${clothingBundleId}`;
      const updatePayload = {
        Selling_Price__c: totalSalesPrice
      };

      await salesforceRequest('PATCH', updateEndpoint, updatePayload);
      console.log(`Selling price for bundle ${clothingBundleId} updated successfully`);
    } else {
      console.log('No update needed; selling price matches the total sales price');
    }

    // Send a success response back to the client
    res.status(200).json({
      message: 'Item deleted and bundle updated successfully',
      itemId: recordId
    });
  } catch (error) {
    console.error('Error processing request:', error.message);
    next(error);
  }
};

