
const Order = require('../models/orderSchema')
const Product = require('../models/productDB')




const orderManagement = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/');
        }

        const orders = await Order.find({}).lean();

   
       
      
        res.render('admin/adminOrders', { orders});
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred');
    }
};



const moreOrderData = async (req, res) => {
    try {
        const orderId = req.query.orderId;

        // Fetch the order details
        const orderData = await Order.findOne({ _id: orderId }).sort({ date: -1 }).lean();

        if (!orderData) {
            return res.status(404).send('Order not found');
        }

        // Extract product IDs from the order
        const productIds = orderData.products.map(product => product.productId);

        // Fetch product details
        const products = await Product.find({ _id: { $in: productIds } }).lean();

        // Map the product details to the ordered products
        const orderedProducts = orderData.products.map(orderProduct => {
            const productDetail = products.find(p => p._id.equals(orderProduct.productId));
            if (!productDetail) {
                console.log(`Product with ID ${orderProduct.productId} not found in products collection`);
                return orderProduct; // Skip adding product details if not found
            }
            return {
                ...orderProduct,
                productName: productDetail.productName,
                salesPrice: productDetail.price,
                img1: productDetail.img1,
                status: orderProduct.cancelstatus, 
                returnReason: orderProduct.reason,
            };
        });

        // Consolidate data into a single order object
        const orderDetails = {
            orderId: orderData._id,
            orderDate: orderData.date,
            orderStatus: orderData.orderStatus,
            paymentMethod: orderData.paymentMethod,
            totalAmount: orderData.totalAmount,
            address: orderData.address,
            products: orderedProducts,
            OrderedDate: orderData.OrderedDate,
        };

        req.session.idOrder = orderDetails.orderId;
        
        const reasons = orderedProducts.map(product => product.returnReason);
        const  reasonReturn = reasons[0]
        console.log(reasons); // Log the reasons for debugging

        // Uncomment the following line to render the response
        res.render('admin/moreOrder', { 
            orderDetails,
            statusOf: orderDetails.orderStatus,
            reasonReturn
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};


const updateOrder = async (req, res) => {
    try {
        const orderId = req.body.orderId;
        const newStatus = req.body.newStatus;

        await Order.findByIdAndUpdate(orderId, {
            $set: {
                orderStatus: newStatus
            }
        }, { new: true });

       
        res.redirect(`/admin/moreOrderData?orderId=${orderId}`);
    } catch (error) {
     console.error("Error updating order status:", error);
        res.status(500).send("Error updating order status");
    }
}





const orderProductUpdate = async (req, res) => {
    try {

        const { productId, newStatus } = req.body;
        const idOrder = req.session.idOrder
        req.session.idOrder = null

        await Order.updateOne(
            { _id: idOrder, 'products._id': productId },
            { 
                $set: {
                    orderStatus: newStatus,
                    'products.$.cancelstatus': newStatus
                }
            }
        );

        res.redirect(`/admin/moreOrderData?orderId=${idOrder}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};




module.exports = {
    orderManagement,
    updateOrder,
    moreOrderData,
    orderProductUpdate
}