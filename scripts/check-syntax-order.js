// quick syntax check loader
try {
  require('../controllers/ordersController.js');
  console.log('ordersController imported successfully');
} catch (err) {
  console.error('Error importing ordersController:', err);
  process.exit(1);
}
