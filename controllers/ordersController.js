import dotenv from "dotenv";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import CounterOrder from "../models/CounterOrder.js";
import nodemailer from 'nodemailer';

dotenv.config();

// Configuration corrigée du transporteur email
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true pour 465, false pour autres ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Mot de passe d'application Gmail
  },
});

export const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate("user", {
      username: 1,
      email: 1,
      fullName: 1,
      phone: 1,
      gender: 1,
      address: 1,
      role: 1,
      image: 1,
      _id: 1,
    });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (
      req.user.role !== "admin" &&
      order.user._id.toString() !== req.user._id.toString()
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const productsCount = order.products.reduce((acc, productId) => {
      acc[productId] = (acc[productId] || 0) + 1;
      return acc;
    }, {});

    const productIds = Object.keys(productsCount);
    const productsDetails = await Product.find({ _id: { $in: productIds } });

    // CALCUL du prix total basé sur les quantités
    let calculatedTotal = 0;
    const products = productIds.map((productId) => {
      const productDetail = productsDetails.find(
        (product) => product._id.toString() === productId.toString()
      );
      const count = productsCount[productId];
      
      // Ajouter au total calculé
      if (productDetail) {
        calculatedTotal += productDetail.price * count;
      }
      
      return {
        _id: productId,
        name: productDetail ? productDetail.name : "Product not found",
        price: productDetail ? productDetail.price : 0,
        desc: productDetail ? productDetail.desc : "No description available",
        images: productDetail ? productDetail.images : [],
        stock: productDetail ? productDetail.stock : 0,
        count: count,
      };
    });

    res.json({ 
      order: {
        ...order.toObject(),
        totalPrice: calculatedTotal // Utiliser le prix recalculé
      }, 
      products 
    });
  } catch (error) {
    console.error("Error while fetching order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    let query = req.user.role === "admin" ? {} : { user: req.user._id };

    const [orders, totalOrders] = await Promise.all([
      Order.find(query)
        .populate("user", {
          username: 1,
          email: 1,
          fullName: 1,
          phone: 1,
          gender: 1,
          address: 1,
          role: 1,
          image: 1,
          _id: 1,
        })
        .sort({createdAt: -1})
        .skip(startIndex)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    const ordersWithUniqueProductIds = orders.map((order) => {
      const uniqueProductIds = [...new Set(order.products)]; // Get unique product IDs

      return {
        ...order.toObject(),
        uniqueProductIds,
      };
    });

    // Get unique product IDs from all orders
    const allUniqueProductIds = [
      ...new Set(
        ordersWithUniqueProductIds.flatMap((order) => order.uniqueProductIds)
      ),
    ];

    // Fetch and populate unique products
    const uniqueProducts = await Product.find(
      {
        _id: { $in: allUniqueProductIds },
      },
      {
        name: 1,
        price: 1,
        desc: 1,
        stock: 1,
      }
    );

    // Map unique products to each order
    const ordersWithPopulatedProducts = ordersWithUniqueProductIds.map(
      (order) => {
        const populatedProducts = order.uniqueProductIds.map((productId) =>
          uniqueProducts.find((product) => product._id.equals(productId))
        );

        return {
          ...order,
          uniqueProducts: populatedProducts,
        };
      }
    );
    const totalPages = Math.ceil(totalOrders / limit);

    const pagination = {
      currentPage: page,
      totalPages: totalPages,
      totalOrders: totalOrders,
    };

    res.json({ orders: ordersWithPopulatedProducts, pagination });
  } catch (error) {
    console.error("Error while fetching orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addOrder = async (req, res) => {
  const { code_order, products, totalPrice, address } = req.body;

  if (!products || Object.keys(products).length === 0) {
    res.status(400).json({
      error: "No products in the order, please add products to the order",
    });
    return;
  }

  // Récupérer les détails des produits pour calculer le prix total
  const productIds = Object.keys(products);
  const productDetails = await Product.find({ _id: { $in: productIds } });

  // RECALCUL du prix total côté serveur pour sécurité
  let calculatedTotalPrice = 0;
  const productsWithDetails = productDetails.map(product => {
    const quantity = products[product._id.toString()];
    const subtotal = product.price * quantity;
    calculatedTotalPrice += subtotal;
    
    return {
      name: product.name,
      price: product.price,
      quantity: quantity,
      subtotal: subtotal
    };
  });

  const processedProducts = Object.entries(products).flatMap(
    ([productId, quantity]) => {
      return Array.from({ length: quantity }, () => productId);
    }
  );

  const bulkOps = processedProducts.map((productId) => ({
    updateOne: {
      filter: { _id: productId, stock: { $gt: 0 } },
      update: { $inc: { stock: -1 } },
    },
  }));

  await Product.bulkWrite(bulkOps);

  // Helper: get next sequence atomically from Counter collection
  async function getNextSequence(name) {
    const updated = await CounterOrder.findOneAndUpdate(
      { _id: name },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    ).lean();
    return updated.seq;
  }

  const finalCode =
    code_order && typeof code_order === "string" && code_order.trim() !== ""
      ? code_order.trim()
      : `CMD#${String(await getNextSequence("order")).padStart(6, "0")}`;

  try {
    const createdOrder = await Order.create({
      code_order: finalCode,
      products: processedProducts,
      totalPrice: calculatedTotalPrice,
      address,
      user: req.user._id,
      date: Date.now(),
    });

    req.user.carts = [];
    req.user.orders.push(createdOrder._id);
    await req.user.save();

    // Envoyer l'email de notification
    await sendOrderNotificationEmail({
      orderCode: finalCode,
      customerName: req.user.fullName || req.user.username,
      customerEmail: req.user.email,
      products: productsWithDetails,
      totalPrice: calculatedTotalPrice,
      address: address,
      orderDate: new Date().toLocaleString('fr-FR')
    });

    res.json({ 
      message: "Order created successfully",
      totalPrice: calculatedTotalPrice,
      orderCode: finalCode
    });
  } catch (error) {
    console.error("Error while creating the order:", error);
    res.status(500).json({ error: "Error while creating the order" });
  }
};

// Fonction pour envoyer l'email de notification
async function sendOrderNotificationEmail(orderDetails) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'beniexbio@gmail.com',
      subject: `🎉 Nouvelle Commande Reçue - ${orderDetails.orderCode}`,
      html: generateOrderEmailTemplate(orderDetails)
    };

    await transporter.sendMail(mailOptions);
    console.log('Email de notification de commande envoyé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de notification:', error);
    // Ne pas bloquer la création de commande en cas d'erreur d'email
  }
}

// Template HTML pour l'email
function generateOrderEmailTemplate(orderDetails) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvelle Commande</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #1e6f41, #28a745);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .order-info {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .product-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .product-table th, .product-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
            .product-table th {
                background: #f8f9fa;
                font-weight: bold;
            }
            .total {
                background: #1e6f41;
                color: white;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                font-size: 1.2em;
                font-weight: bold;
                margin-top: 20px;
            }
            .address-info {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin-top: 20px;
            }
            .badge {
                background: #ffc107;
                color: #333;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 0.8em;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎉 Nouvelle Commande Reçue !</h1>
            <p>Une nouvelle commande vient d'être passée sur votre boutique</p>
        </div>
        
        <div class="content">
            <div class="order-info">
                <h2>Détails de la Commande</h2>
                <p><strong>Numéro de commande :</strong> <span class="badge">${orderDetails.orderCode}</span></p>
                <p><strong>Client :</strong> ${orderDetails.customerName} (${orderDetails.customerEmail})</p>
                <p><strong>Date de commande :</strong> ${orderDetails.orderDate}</p>
            </div>

            <h3>Produits Commandés</h3>
            <table class="product-table">
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th>Prix Unitaire</th>
                        <th>Quantité</th>
                        <th>Sous-total</th>
                    </tr>
                </thead>
                <tbody>
                    ${orderDetails.products.map(product => `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.price.toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}</td>
                            <td>${product.quantity}</td>
                            <td>${product.subtotal.toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="total">
                Total de la commande : ${orderDetails.totalPrice.toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}
            </div>

            <div class="address-info">
                <h3>Adresse de Livraison</h3>
                <p><strong>Rue :</strong> ${orderDetails.address.street}</p>
                <p><strong>Ville :</strong> ${orderDetails.address.city}</p>
                <p><strong>Code postal :</strong> ${orderDetails.address.zip}</p>
                <p><strong>Téléphone :</strong> ${orderDetails.address.phone}</p>
                ${orderDetails.address.note_sur_commande ? `
                <p><strong>Notes :</strong> ${orderDetails.address.note_sur_commande}</p>
                ` : ''}
            </div>

            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 8px;">
                <p><strong>⚠️ Action Requise</strong></p>
                <p>Veuillez traiter cette commande dans les plus brefs délais.</p>
                <p>Connectez-vous à votre panel d'administration pour plus de détails.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

const updateOrderStatus = async (req, res, newStatus) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    order.status = newStatus;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error(`Error while updating order to ${newStatus}:`, error);
    res
      .status(500)
      .json({ error: `Error while updating order to ${newStatus}` });
  }
};

export const updateOrderToAccepted = async (req, res) => {
  await updateOrderStatus(req, res, "accepted");
};

export const updateOrderToRejected = async (req, res) => {
  await updateOrderStatus(req, res, "rejected");
};

export const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (
      req.user.role !== "admin" &&
      order.user._id.toString() !== req.user._id.toString()
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    await order.deleteOne();
    res.json({ message: "Order deleted" });
  } catch (error) {
    console.error("Error while deleting order:", error);
    res.status(500).json({ error: "Error while deleting order" });
  }
};

export const orderStatusReport = async (req, res) => {
  try {
    const orders = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    const orderStatuses = ["accepted", "rejected", "pending"];
    const missingStatuses = orderStatuses.filter(
      (status) => !orders.some((order) => order.status === status)
    );

    const nonExistingStatuses = missingStatuses.map((status) => ({
      status: status,
      count: 0,
    }));

    const report = [...orders, ...nonExistingStatuses];

    res.json(report);
  } catch (error) {
    console.error("Error while fetching order status report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
