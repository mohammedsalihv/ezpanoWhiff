const mongoose = require('mongoose');
const easyinvoice = require("easyinvoice");
const Order = require('../models/orderSchema');
const Product = require('../models/productDB');
const User = require('../models/userDB');
const Wallet = require('../models/walletSchema')






const successOrder = async (req,res)=>{

    try {
        
        const orderId = req.params.orderId
        const orderSuccess =  await Order.findById(orderId)
       
        res.render('user/successOrder' , {order :orderSuccess , orderId})

    } catch (error) {
        console.log(error)
    }
}







const ordersPage = async (req, res) => {
    try {
        const userLogged = req.session.user ? true : false;
        const orderID = req.query.orderId;

        if (!orderID) {
            return res.status(400).json({ error: "Order ID is required" });
        }

        const orders = await Order.findById(orderID).lean();

        if (!orders) {
            return res.status(404).json({ error: "Order not found" });
        }

        const productIds = orders.products.map(product => product.productId);
        const products = await Product.find({ _id: { $in: productIds } }).lean();

        const orderedProducts = orders.products.map(orderProduct => {
            const productDetail = products.find(p => p._id.equals(orderProduct.productId));
            return {
                ...orderProduct,
                productName: productDetail.productName,
                salesPrice: productDetail.price,
                img1: productDetail.img1,
                productId: productDetail._id,
                orderId: orders._id,
                statusProduct: orderProduct.cancelstatus
            };
        });

        const ordersIndexes = orders.products.length === 1 ? true : false;
        const user = orders.userId;
        const userData = await User.findById(user).lean();

        const statusOrder = orders.orderStatus;
        const isDelivered = statusOrder === 'Delivered';
        const isCanceled = statusOrder === 'canceled';

        res.render('user/orders', { 
            ordersIndexes, 
            userLogged, 
            orders, 
            userData, 
            orderID, 
            orderedProducts, 
            isDelivered, 
            isCanceled 
        });
    } catch (error) {
        console.error("Error occurred during orders listing:", error);
        res.status(500).json({ error: "Orders list page render error" });
    }
};





const returnProductOrder = async (req, res) => {
    try {
        const returnReason = req.body.returnReason;
        const orderId = req.body.orderId;
        const productId = req.body.productId
;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        await Order.updateOne(
            { _id: orderId, 'products._id': productId },
           { $set: {
                returnReason: returnReason,
                orderStatus: 'returned',
                'products.$.cancelstatus': 'returned',
                'products.$.reason': returnReason
            }
          } 
        )

     
        res.redirect(`/orderView?orderId=${orderId}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while returning the order" });
    }
}






const returnOrder = async (req, res) => {
    try {
        const { returnReason, orderId } = req.body;

        console.log(orderId, returnReason);
     
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Loop through each product and update its cancelstatus and reason
        for (let i = 0; i < order.products.length; i++) {
            await Order.updateOne(
                { _id: orderId, [`products.${i}.productId`]: order.products[i].productId },
                {
                    $set: {
                        [`products.${i}.cancelstatus`]: 'returned',
                        [`products.${i}.reason`]: returnReason,
                    }
                }
            );
        }

        // Update the overall order status if necessary
        await Order.updateOne(
            { _id: orderId },
            { 
                $set: { 
                    orderStatus: 'returned', 
                    returnReason: returnReason 
                }
            }
        );
        
        res.redirect(`/orderView?orderId=${orderId}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while returning the order" });
    }
};




const cancelOrder = async (req, res) => {
    try {
      const orderId = req.body.orderId;
    
      const order = await Order.findById(orderId)
      const paymentMethod = order.paymentMethod
      const userId = req.session.user._id

      if(paymentMethod  === 'wallet'){

        const totalAmount = order.totalAmount
        const wallet = await Wallet.findOne({wallet_user : userId})

           // Create transaction
           const newTransaction = {
            amount: totalAmount,
            type: 'credited',
            description: 'Order payment',
            canceled : 'order canceled'
        };

         wallet.transactions.push(newTransaction);
         // Mark transactions as modified
         wallet.markModified('transactions');
         wallet.balance += totalAmount;
         await wallet.save();

      }


      if (order.orderStatus !== 'Delivered') {
        try {
          const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId },
            {
              $set: {
                orderStatus: 'canceled',
                'products.$[elem].cancelstatus': 'canceled' // Update the cancelstatus of the matched element
              }
            },
            {
              arrayFilters: [{ 'elem.cancelstatus': { $ne: 'canceled' } }],
              new: true // Return the updated document
            }
          );

          console.log('Updated order:', updatedOrder);
        } catch (error) {
          console.error('Error updating order:', error);
        }
      }
    return res.status(200).json({ message: "Order cancelled successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Item already delivered" });
    }
  }
  





const productStatusReturn = async (req,res)=>{
    try {
        
    
        const newStatus = 'returned';
        const orderId = req.query.orderId
        const productId = req.query.productId

    
        const orderData = await Order.updateOne(
            { _id: orderId, "products.productId": productId },
            {
                $set: { "products.$.cancelstatus": newStatus }
            }
        );

     
        if (orderData.nModified === 0) {
            return res.status(404).json({ message: 'Order or Product not found' });
        }
        res.redirect(`/orderView?orderId=${orderId}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while updating the product status' });
    }
}





const productStatusCancel = async (req,res)=>{

    try {
        
        const userId = req.session.user._id
        const newStatus = 'canceled';
        const orderId = req.query.orderId
        const productId = req.query.productId


        const orderData = await Order.updateOne(
            { _id: orderId, "products.productId": productId },
            {
                $set: { "products.$.cancelstatus": newStatus }
            }
        );



        const order = await Order.findById(orderId)
        const paymentMethod = order.paymentMethod
       
        if(paymentMethod  === 'wallet'){
  
          const totalAmount = order.totalAmount
          const wallet = await Wallet.findOne({wallet_user : userId})
  
             // Create transaction
             const newTransaction = {
              amount: totalAmount,
              type: 'credited',
              description: 'Order payment',
              canceled : 'order canceled'
          };
  
           wallet.transactions.push(newTransaction);
           // Mark transactions as modified
           wallet.markModified('transactions');
           wallet.balance += totalAmount;
           await wallet.save();
  
        }

        if (orderData.nModified === 0) {
            return res.status(404).json({ message: 'Order or Product not found' });
        }
        res.redirect(`/orderView?orderId=${orderId}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while updating the product status' });
    }

}






const invoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId)
                                 .populate('userId')
                                 .populate('products.productId')
                                 .lean();

        if (!order) {
            return res.status(404).send('Order not found');
        }


        
        const invoiceID =  orderId.substring(0 , 9)
        
        const data = {
            documentTitle: 'Order Invoice',
            currency: 'USD',
            taxNotation: 'gst',
            marginTop: 25,
            marginRight: 25,
            marginLeft: 25,
            marginBottom: 25,
            logo: '/Logo/5313c5dfeae341de827bdfebb4154726.png',
            sender: {
                company: 'Ezpano Whiff Pvt Ltd',
                address: 'ezpanowhiffotp@gmail.com',
                city: 'Malappuram',
                zip: '679338',
                state: 'Kerala',
            },
            client: {
                company: `${order.address.fullname}`,
                phone: `${order.address.phone}`,
                address: `${order.address.addressLine}`,
                zip: `${order.address.pincode}`,
                city: `${order.address.City}`,
                state: `${order.address.state}`,
            },
             information: {
                number:  invoiceID,
                date: new Date().toDateString(),
            },
            products: [],
        };

        order.products.forEach(product => {
            data.products.push({
                quantity: `${product.quantity}`,
                description: `${product.productId.productName}`,
                price: `${product.productId.price}`,
            });
        });

        console.log('Invoice Data:', data); // Log the data to verify

        // Generate the PDF
        const result = await easyinvoice.createInvoice(data);

        // Set response headers to trigger a download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${order._id}.pdf"`);

        // Send the PDF as a buffer to the response stream
        res.send(Buffer.from(result.pdf, 'base64'));
    } catch (error) {
        console.log('Error generating invoice:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {

    ordersPage , returnOrder , cancelOrder , productStatusReturn , productStatusCancel , successOrder, invoice ,
    returnProductOrder
}