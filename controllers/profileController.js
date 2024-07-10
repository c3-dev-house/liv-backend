import {getBeneficiaryDetails} from "../services/salesforceService.js";
import { salesforceRequest } from "../services/salesforceService.js";

export const getProfile = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const response = await getBeneficiaryDetails(userId);

    res.json({
      username: response[0].Username__c,
      aboutMe:response[0].About_Me__c,
      streetAddress:response[0].Street_Address__c,
    });
  } catch (error) {
    next(error);
  }
};


export const updateBeneficiary = async (req, res, next) => {
  const userId = req.params.userId;
  const { username, aboutMe, streetAddress } = req.body; // Extract fields from request body

  try {
    // Construct the payload
    const updatedItem = {
      Username__c: username,
      About_Me__c: aboutMe,
      Street_Address__c: streetAddress
    };

    // Define the endpoint to update the existing record in Salesforce
    const endpoint = `/services/data/v52.0/sobjects/Beneficiary__c/${userId}`;

    // Send the PUT request to Salesforce
    console.log('Sending request to Salesforce to update the user...');
    await salesforceRequest('PATCH', endpoint, updatedItem); // Note: Use 'PATCH' for partial updates in Salesforce
    console.log('User updated successfully in Salesforce');
    // Send a success response back to the client
    res.status(200).json({
      message: 'User updated successfully',
      username: updatedItem.Username__c,
      aboutMe:updatedItem.About_Me__c,
      streetAddress:updatedItem.Street_Address__c,
    });
  } catch (error) {
    console.error('Error updating item in Salesforce:', error.message);
    next(error);
  }
};