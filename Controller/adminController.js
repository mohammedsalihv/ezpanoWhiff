const admin = require('../models/admin')
const bcrypt = require('bcrypt')
const Order = require('../models/orderSchema')
const Product = require('../models/productDB')
const Category = require('../models/category')
const User = require('../models/userDB')



// ADMIN LOGIN

const adminLogin = (req, res) => {

    try {
        if (req.session.admin) {
            res.redirect('/admin/adminDashboard')
        } else {
            res.render('admin/adminLogin')
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
    }
}



const preventing = (req, res) => {
    res.redirect('/admin/adminDashboard')
}







// ADMIN CREDENTIAL VALIDATION 

const adminLoginValidation = async (req, res) => {
    try {

        const { email, password } = req.body || {}

           const Admin = await admin.findOne({email})
           if(Admin){

            const validation = await admin.find({});
            let validationEmail, validationPassword;

            validation.forEach(adminData => {
            validationEmail = adminData.email;
            validationPassword = adminData.password;
           });

              if (validationEmail === email && await bcrypt.compare(password, validationPassword)) {

               req.session.admin = email
               res.cookie('sessionID', req.sessionID, { httpOnly: true });
    
               res.redirect('/admin/adminDashboard')
            } else {

                res.render('admin/adminLogin', { InvalidAdmin: 'email or password mismatch' })
            }
        
        }else{
            res.render('admin/adminLogin', {notAdmin : 'Access Denied: You do not have permission to access the admin panel'})
        } 
} catch (error) {
        
        console.error('Error:', error);
        res.status(500).send('An error occurred');
    }
};






// ADMIN DASHBOARD

const adminDashboard = async (req, res) => {
    try {
        if (req.session.admin) {

            const ordersCount = await Order.countDocuments({}).lean()
            const productCounts = await Product.countDocuments({}).lean()
            const categoryCounts = await Category.countDocuments({}).lean()
            const users = await User.countDocuments({}).lean()

            let totalRevenue = await Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$totalAmount" } // Assuming total_amount is the field name
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalAmount: 1
                    }
                }
            ]);

            const totalAmount = totalRevenue[0].totalAmount;
            
             res.render('admin/Dashboard' , {ordersCount , productCounts , categoryCounts , users , totalAmount})
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
    }
}






const salesReport = async (req, res) => {
    try {
        const { startDate, endDate, reportTime } = req.body || {};

        if (!reportTime) {
            return res.status(400).json({ message: 'reportTime is required' });
        }

        const currentDate = new Date();
        let calculatedStartDate, calculatedEndDate;

        switch (reportTime) {
            case '1': // daily
                toDate = new Date();
                fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1);
                break;
            case '2': // weekly
                toDate = new Date();
                fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7);
                break;
            case '3': // monthly
                toDate = new Date();
                fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
                break;
            case '4': // yearly
                toDate = new Date();
                fromDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            default:
                fromDate = startDate
                toDate = endDate
              
        }


        if( new Date(fromDate) >= new Date(toDate)) return res.json({ error: 'start date must be less than end date'});
        let orders = await Order.find({
            deliveredAt: {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            }
        }).populate('userId');

        console.log(calculatedStartDate, calculatedEndDate, reportTime);

        const topProducts = await getTopProductsSale(calculatedStartDate, calculatedEndDate);

       
        const topCategories = await getTopCategories(calculatedStartDate, calculatedEndDate);
        const totalUsers = await usersCount(calculatedStartDate, calculatedEndDate);
        const totalOrders = await orderCount(calculatedStartDate, calculatedEndDate);
        const totalRevenue = await getRevenueAmount(calculatedStartDate, calculatedEndDate);
        const topBrands = await topSaledBrands(calculatedStartDate, calculatedEndDate);
        const totalProducts = await Product.find({}).countDocuments().lean();

        console.log(calculatedStartDate, calculatedEndDate, reportTime);
        console.log(topProducts, topCategories, totalUsers, totalOrders, totalRevenue, totalProducts, topBrands);
        
        return res.status(200).json({ 
            topProducts, 
            topCategories, 
            totalUsers, 
            totalOrders, 
            totalRevenue, 
            totalProducts, 
            topBrands 
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};




const getTopProductsSale = async (fromDate, toDate) => {
    try {
        let pipeline = [];

        if (fromDate && toDate) {
            pipeline = [
                {
                    $match: {
                        ExpectedArrival:
                         {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate)
                        }
                    }
                }
            ];
        }

        pipeline.push(
            {
                $unwind: '$products'
            },
            {
                $group: {
                    _id: '$products.productId',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    productName: { $arrayElemAt: ['$productInfo.productName', 0] }
                }
            }
        );

        const productsSale = await Order.aggregate(pipeline).lean();
        return productsSale;
    } catch (error) {
        console.error('Error getting top products sale:', error);
        throw error;
    }
};

const getTopCategories = async (fromDate, toDate) => {
    try {
        let pipeline = [];

        if (fromDate && toDate) {
            pipeline = [
                {
                    $match: {
                        ExpectedArrival: {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate)
                        }
                    }
                }
            ];
        }

        pipeline.push(
            {
                $unwind: '$products'
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            {
                $unwind: '$productInfo'
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productInfo.category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $unwind: '$categoryInfo'
            },
            {
                $group: {
                    _id: '$categoryInfo.categoryName',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    categoryName: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        );

        const categoriesSale = await Order.aggregate(pipeline).lean();
        return categoriesSale;
    } catch (error) {
        console.error('Error getting top categories sale:', error);
        throw error;
    }
};

const usersCount = async (fromDate, toDate) => {
    let noOfUsers;
    if (fromDate && toDate) {
        noOfUsers = await User.find({ created_at: { $gte: new Date(fromDate), $lte: new Date(toDate) } }).countDocuments().lean();
    } else {
        noOfUsers = await User.find({}).countDocuments().lean();
    }
    return noOfUsers;
};

const orderCount = async (fromDate, toDate) => {
    let noOfOrders;
    if (fromDate && toDate) {
        noOfOrders = await Order.find({ deliveredAt: { $gte: new Date(fromDate), $lte: new Date(toDate) } }).countDocuments().lean();
    } else {
        noOfOrders = await Order.find({}).countDocuments().lean();
    }
    return noOfOrders;
};

const getRevenueAmount = async (fromDate, toDate) => {
    let revenueAmount = 0;

    if (fromDate && toDate) {
        revenueAmount = await Order.aggregate([
            {
                $match: {
                    deliveredAt: {
                        $gte: new Date(fromDate),
                        $lte: new Date(toDate)
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalAmount" }
                }
            }
        ]).lean();
    } else {
        revenueAmount = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalAmount" }
                }
            }
        ]).lean();
    }
    return revenueAmount.length > 0 ? revenueAmount[0].totalAmount : 0;
};

const topSaledBrands = async (fromDate, toDate) => {
    try {
        const pipeline = [];

        if (fromDate && toDate) {
            pipeline.push({
                $match: {
                    deliveredAt: {
                        $gte: new Date(fromDate),
                        $lte: new Date(toDate),
                    },
                },
            });
        }

        pipeline.push({
            $group: {
                _id: "$brand",
                count: { $sum: 1 },
            },
        });

        pipeline.push({
            $sort: {
                count: -1,
            },
        });

        const brands = await Product.aggregate(pipeline).lean();
        return brands;
    } catch (err) {
        console.log(`Error at topSaledBrands: ${err}`);
        throw err;
    }
};


// ADMIN LOGOUT


const adminLogout = (req, res) => {
    try {

        req.session.destroy((error) => {

            if (error) {
                console.log(error);
            } else {
                res.redirect('/admin/login')
            }
        })

    } catch (error) {
        console.error("Error:: Logout", error);
        return res.status(500).json({ message: "An error occurred logout" });
    }
}





module.exports = {
    adminLogin,
    preventing,
    adminLoginValidation,
    adminLogout,

    adminDashboard,
    salesReport

}