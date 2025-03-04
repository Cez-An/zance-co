
const loadHomepage = async (req, res) => {
    try {
        res.render('user/home')
    } catch (error) {
        res.status(500).send("Server Error");
    }
};

export default {loadHomepage};
