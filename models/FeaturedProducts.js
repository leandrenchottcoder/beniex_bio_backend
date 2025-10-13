import mongoose from 'mongoose';

const featuredProductsSchema = new mongoose.Schema({
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    featured: { type: Boolean, default: false },
}, {timestamps: true});

const FeaturedProducts = mongoose.model('FeaturedProducts', featuredProductsSchema);
export default FeaturedProducts;