// quick syntax check loader
try {
  require('../controllers/productController.js');
  console.log('productController imported successfully');
} catch (err) {
  console.error('Error importing productController:', err);
  process.exit(1);
}
