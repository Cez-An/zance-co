import STATUS_CODE from "../../helpers/statusCode.js";
import Coupon from "../../models/couponSchema.js";
import User from "../../models/userSchema.js";


const validateCoupon = async (req, res) => {
    try {
        const { code, total,currentCoupon } = req.body;                

        const userId = req.session.user?.id ?? req.session.user?._id ?? null;

        const coupon = await Coupon.findOne({ code });

        if (!coupon) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, message: 'Invalid coupon code.' });
        }

        if (coupon.status !== 'Active') {
            return res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, message: 'Coupon is inactive.' });
        }

        const now = new Date();
        if (now < coupon.startDate || now > coupon.expiryDate) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, message: 'Coupon has expired or is not yet active.' });
        }

        if (total < coupon.minPrice) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success: false,
                message: `Minimum order value should be ₹${coupon.minPrice}.`
            });
        }

        if (coupon.usageType === 'single-use' && coupon.usersUsed?.includes(userId)) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success: false,
                message: 'You have already used this coupon.'
            });
        }

        return res.status(STATUS_CODE.SUCCESS).json({
            success: true,
            message: `Coupon applied! ₹${coupon.offerPrice} discount applied.`,
            discount: coupon.offerPrice,
            couponId: coupon._id
        });
    } catch (error) {
        console.error(error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal Server Error' });
    }
};



export default {validateCoupon,}