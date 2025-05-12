import STATUS_CODE from "../../helpers/statusCode.js";
import Coupon from "../../models/couponSchema.js";
import User from "../../models/userSchema.js";


const loadCouponPage = async(req,res)=>{
    try {
        const { q, status, page = 1 } = req.query;
        const limit = 7;
        let query = {};

        if (q) {
            query.name = { $regex: q, $options: 'i' };
        }

        if (status) {
            query.status = status === 'true' ? 'Active' : 'Inactive';
        }

        const totalCoupons = await Coupon.countDocuments(query);
        const totalPages = Math.ceil(totalCoupons / limit);
        const coupons = await Coupon.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.render('admin/coupons', {
            coupons,
            currentPage: parseInt(page),
            totalPages,
            searchQuery: q || '',
            selectedFilter: status
        });
    } catch (err) {
        console.error(err);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Server Error' });
    }
}

const addCoupon = async (req, res)=> {
    try {
        const { addName, addCode, addDescription, addStartDate, addExpiryDate, addMinPrice, addOfferPrice, addStatus, addUsageType } = req.body;
   
        if (new Date(addStartDate) >= new Date(addExpiryDate)) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Expiry date must be after start date' });
        }
        if (parseFloat(addMinPrice) < parseFloat(addOfferPrice)) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Minimum price must be greater than offer price' });
        }

        await Coupon.create({
            name: addName,
            code: addCode, 
            description: addDescription,
            startDate: addStartDate,
            expiryDate: addExpiryDate,
            minPrice: addMinPrice,
            offerPrice: addOfferPrice,
            status: addStatus,
            usageType: addUsageType
        });
        
        return res.status(STATUS_CODE.SUCCESS).json({ message: 'Coupon added successfully' });

    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Coupon name already exists' });
        } else {
            res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Server Error' });
        }
    }
}

const editCoupon = async (req, res) => {
    try {
        const { orgName, editName, editCode, editDescription, editStartDate, editExpiryDate, editMinPrice, editOfferPrice, editStatus, editUsageType } = req.body;

        if (new Date(editStartDate) >= new Date(editExpiryDate)) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Expiry date must be after start date' });
        }
        if (parseFloat(editMinPrice) < parseFloat(editOfferPrice)) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Minimum price must be greater than offer price' });
        }

        const coupon = await Coupon.findOneAndUpdate(
            { name: orgName },
            { 
                name: editName,
                code: editCode,
                description: editDescription,
                startDate: editStartDate,
                expiryDate: editExpiryDate,
                minPrice: editMinPrice,
                offerPrice: editOfferPrice,
                status: editStatus,
                usageType: editUsageType,
            }, 
            { new: true }
        );
        
        if (coupon) {
            return res.status(STATUS_CODE.SUCCESS).json({ message: 'Coupon updated successfully' });
        } else {
            return res.status(STATUS_CODE.BAD_REQUEST).json({ error : 'Coupon updated Failed' });
        }
        

        
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            res.status(STATUS_CODE.BAD_REQUEST).json({ error: 'Coupon name already exists' });
        } else {
            res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Server Error' });
        }
    }
}

const deleteCoupon = async (req,res) => {
    try {
        const {couponName} = req.body;
        
        const coupon = await Coupon.findOneAndDelete({ name : couponName });
        if (!coupon) {
            return res.status(STATUS_CODE.NOT_FOUND).json({ error: 'Coupon not found' });
        }
        res.status(STATUS_CODE.SUCCESS).json({ message: 'Coupon deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Server Error' });
    }
}

const loadCoupons = async (req,res)=>{
    const userId = req.session.user?.id ?? req.session.user?._id ?? null;

    if(!userId){
        res.redirect('/user/login')
    }

    const user = await User.findOne({ _id : userId, isBlocked : false});

    if(!user){
        return res.redirect('/')
    }

    const [firstName] = user.name.split(' ');

    const coupons = await Coupon.find({});


    res.render('user/coupons', {title : "coupons", coupons, user, firstName});
}

export default {loadCouponPage, addCoupon, editCoupon, deleteCoupon, loadCoupons }