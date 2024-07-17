import { salesforceRequest } from '../services/salesforceService.js';
import { getAllUserFromSalesforce } from '../services/salesforceService.js';

export const getAllBeneficiaries = async (req, res, next) => {
    try {
          // Fetch all users from Salesforce
          const users = await getAllUserFromSalesforce();

          // Return the users in the response
          res.status(200).json(users);
    } catch (error) {
        console.error('Error displaying users:', error);
        next(error);
    }
};


