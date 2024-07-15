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

export const deleteAllClothingBundles = async (req, res, next) => {
  try {
      await deleteAllClothingBundles();
      res.status(200).json({ message: 'All clothing bundles deleted successfully.' });
  } catch (error) {
      console.error('Error deleting all clothing items:', error);
      next(error);
  }
};


