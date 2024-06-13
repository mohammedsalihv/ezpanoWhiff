const express = require('express')
const admin_routes = express.Router()
const Controller = require('../Controller/adminController')
const store = require('../helpers/multer')
const productController = require('../Controller/productController')
const categoryController = require('../Controller/categoryController')
const adminUserController = require('../Controller/adminUserController')
const bannerController = require('../Controller/adminBannerController')
const adminOrderController = require('../Controller/adminOrderManagement')
const admincouponController = require('../Controller/admincouponController')
const adminOfferController = require('../Controller/adminOfferController')
const user_route = require('./user')



// ---------ADMIN LOGIN ---------//

admin_routes.get('/login' , Controller.adminLogin)
admin_routes.get('/adminLogin', Controller.preventing)
admin_routes.get('/adminLogout' , Controller.adminLogout)

admin_routes.post('/adminValidation', Controller.adminLoginValidation)






// ------------ADMIN  USER CONTROLLER ----------//




admin_routes.get('/listUsers' , adminUserController.userManagement)
admin_routes.get('/deleteUser/:userId',adminUserController.deleteUser)
admin_routes.get('/blockUser/:userId' , adminUserController.blockUser)
admin_routes.get('/unBlockUser/:userId', adminUserController.unBlockUser)






// --------------ADMIN  PRODUCT CONTROLLER ----------//

admin_routes.get('/productManagement', productController.productManagement)
admin_routes.get('/productManagementDetail' , productController.productManagementDetail)
admin_routes.get('/productManagement/addProduct', productController.addProduct)
admin_routes.get('/productEdit/:id',productController.productEdit)
admin_routes.get('/deleteProduct/:id',productController.deleteProducts)
admin_routes.get('/deleteSoft/:id' , productController.softDelete)


admin_routes.post('/productUpload', store.any() , productController.uploadProduct)
admin_routes.post('/productUpdate/:id',store.any() , productController.updateProduct)





// -------------- ADMIN CATEGORY CONTROLLER ------------//

admin_routes.get('/categoryManagement', categoryController.categoryManagement)
admin_routes.get('/addCategory', categoryController.addCategory)
admin_routes.get('/editCategory/:id', categoryController.editCategory)
admin_routes.get('/deleteCategory/:id', categoryController.deleteCategory)


admin_routes.post('/addingNewCategory', categoryController.newCategory)
admin_routes.post('/updateCategory/:id', categoryController.updateCategory)




// ----------------- Order Management -------------------//

admin_routes.get('/orderManagement' , adminOrderController.orderManagement)
admin_routes.get('/moreOrderData' , adminOrderController.moreOrderData)
admin_routes.post('/ordersUpdate' , adminOrderController.updateOrder)
admin_routes.post('/ordersProductUpdate' , adminOrderController.orderProductUpdate)







// ---------------- COUPAN --------------------//



admin_routes.get('/couponManagement' , admincouponController.couponLists)
admin_routes.get('/addCoupon' , admincouponController.addCouponNew)
admin_routes.get('/editCouponPage/:couponId' , admincouponController.editCouponPage)

admin_routes.post('/couponAdding' , admincouponController.couponNew)
admin_routes.post('/CouponEdited/:couponId' , admincouponController.couponEdited)
admin_routes.post('/listuser/:couponId' , admincouponController.listORunlist)
admin_routes.delete('/couponDelete/:couponId' , admincouponController.deleteCoupon)




// ------------ Offer ------------------------------//


admin_routes.get('/offerManagement' , adminOfferController.offerPage )
admin_routes.get('/addOffer' , adminOfferController.addOffer)

admin_routes.post('/createOffer' , adminOfferController.newOffer)
admin_routes.delete('/offerDelete/:offerId' , adminOfferController.deleteOffer)



//---------------Dashbaord and sales report


admin_routes.get('/adminDashboard', Controller.adminDashboard)


admin_routes.post('/salesReport' , Controller.salesReport)

// ------------- ADMIN BANNER CONTROLLER ---------------//


admin_routes.get('/banner',bannerController.banner)













module.exports = admin_routes;