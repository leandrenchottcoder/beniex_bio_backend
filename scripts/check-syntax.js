// quick syntax check loader
try {
  require('../controllers/supportController.js');
  console.log('supportController imported successfully');
} catch (err) {
  console.error('Error importing supportController:', err);
  process.exit(1);
}
