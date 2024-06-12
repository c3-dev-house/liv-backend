import { getProducts } from '../services/shopifyService.js';

export const getVendorProducts = async (req, res, next) => {
  const { vendor } = req.query;

  if (!vendor) {
    return res.status(400).json({ error: 'Vendor query parameter is required' });
  }

  try {
    const products = await getProducts(vendor);
    const transformedProducts = products.map(product => ({
        id: product.id,
        title: product.title,
        vendor: product.vendor,
        bodyHtml: product.body_html,
        createdAt: new Date(product.created_at).toISOString().split('T')[0],
        status: product.status,
        variants: product.variants.map(variant => ({
          id: variant.id,
          price: variant.price
        }))
      }));
    res.json(transformedProducts);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    next(error);
  }
};
