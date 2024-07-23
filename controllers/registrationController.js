import { registerApplicant } from '../services/shopifyService.js';

export const addApplicant = async (req, res, next) => {
    try {
      const formData = req.body;
      console.log('backend formData',formData);
      const applicant = await registerApplicant(formData);
      console.log('Applicant',applicant)
      res.json(applicant);
    } catch (error) {
      console.error('Error fetching applicant:', error.message);
      next(error);
    }
  };