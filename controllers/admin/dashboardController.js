import Order from "../../models/orderSchema.js";
import Category from "../../models/categorySchema.js";
import mongoose from "mongoose";
import STATUS_CODE from "../../helpers/statusCode.js";

const renderDashboardStats = async (req, res) => {
  try {
  
    const filter = req.query.filter || "monthly";
    const now = new Date();
    let startDate = new Date();

    if (filter === "weekly") {
      startDate.setDate(now.getDate() - 7);
    } else if (filter === "yearly") {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const deliveredOrders = await Order.find({
      status: "Delivered",
      createdAt: { $gte: startDate }
    }).populate("orderItems.product");

    const productMap = {}, brandMap = {}, categoryMap = {};
    const chartDataMap = {};
    const categoryIds = new Set();

    for (let order of deliveredOrders) {
      const orderDate = new Date(order.createdAt);
      let label;

      if (filter === "weekly") {
        label = orderDate.toLocaleDateString("en-IN", { weekday: "short" });
      } else if (filter === "yearly") {
        label = orderDate.toLocaleString("en-IN", { month: "short" });
      } else {
        const week = Math.ceil(orderDate.getDate() / 7);
        label = `${orderDate.toLocaleString("en-IN", { month: "short" })} W${week}`;
      }

      if (!chartDataMap[label]) chartDataMap[label] = 0;

      for (let item of order.orderItems) {
        const revenue = (item.finalPrice || item.basePrice) * item.quantity;

        productMap[item.name] = (productMap[item.name] || 0) + revenue;
        if (item.brand) brandMap[item.brand] = (brandMap[item.brand] || 0) + revenue;

        if (item.product?.category) categoryIds.add(item.product.category.toString());
        chartDataMap[label] += revenue;
      }
    }

    const categories = await Category.find({ _id: { $in: [...categoryIds] } });
    const categoryNameMap = {};
    categories.forEach(cat => categoryNameMap[cat._id.toString()] = cat.name);

    for (let order of deliveredOrders) {
      for (let item of order.orderItems) {
        const categoryId = item.product?.category?.toString();
        const name = categoryNameMap[categoryId];
        if (name) {
          const revenue = (item.finalPrice || item.basePrice) * item.quantity;
          categoryMap[name] = (categoryMap[name] || 0) + revenue;
        }
      }
    }

    const formatTop10 = (map, key) =>
      Object.entries(map).sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([label, total]) => ({ [key]: label, total }));

    const topProducts = formatTop10(productMap, "product");
    const topBrands = formatTop10(brandMap, "brand");
    const topCategories = formatTop10(categoryMap, "category");

    const chartLabels = Object.keys(chartDataMap);
    const chartData = chartLabels.map(label => chartDataMap[label]);
    
    res.json({ topProducts, topBrands, topCategories, chartLabels, chartData });

  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Server Error" });
  }
};

export default {
  renderDashboardStats
};
