import { Order, OrderStats } from '../model/types';

/**
 * Tính toán số liệu thống kê đơn hàng chuẩn xác 100% trực tiếp trên Client (0ms latency, 0 API call)
 */
export function calculateOrderStats(orders: Order[]): OrderStats {
  const totalOrders = orders.length;

  let totalRevenue = 0;
  let totalShippingFee = 0;
  let totalCostPrice = 0;
  let totalPaid = 0;
  let totalRemaining = 0;

  let orderedCount = 0;
  let cnWarehouseCount = 0;
  let vnWarehouseCount = 0;
  let atHomeCount = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;

  for (const order of orders) {
    const rev = Number(order.totalAmount) || 0;
    const paid = Number(order.paidAmount) || 0;
    const cost = Number(order.costPrice) || 0;
    const ship = Number(order.shippingFee) || 0;

    switch (order.status) {
      case 'ORDERED':
        orderedCount++;
        break;
      case 'CN_WAREHOUSE':
        cnWarehouseCount++;
        break;
      case 'VN_WAREHOUSE':
        vnWarehouseCount++;
        break;
      case 'AT_HOME':
        atHomeCount++;
        break;
      case 'COMPLETED':
        completedOrders++;
        break;
      case 'CANCELLED':
        cancelledOrders++;
        break;
      default:
        orderedCount++;
        break;
    }

    // Đơn hủy không tính vào doanh thu và lợi nhuận
    if (order.status !== 'CANCELLED') {
      totalRevenue += rev;
      totalPaid += paid;
      totalCostPrice += cost;
      totalShippingFee += ship;
      totalRemaining += Math.max(0, rev - paid);
    }
  }

  const inProgressCount = orderedCount + cnWarehouseCount + vnWarehouseCount + atHomeCount;
  const netRevenue = totalRevenue - totalShippingFee;
  const profit = totalRevenue - totalShippingFee - totalCostPrice;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const nonCancelledOrders = totalOrders - cancelledOrders;
  const completionRate =
    nonCancelledOrders > 0 ? (completedOrders / nonCancelledOrders) * 100 : 0;

  return {
    totalOrders,
    totalRevenue,
    totalShippingFee,
    totalCostPrice,
    netRevenue,
    profit,
    profitMargin: Math.round(profitMargin * 10) / 10,
    totalPaid,
    totalRemaining,
    orderedCount,
    cnWarehouseCount,
    vnWarehouseCount,
    atHomeCount,
    inProgressCount,
    completedOrders,
    cancelledOrders,
    completionRate: Math.round(completionRate * 10) / 10,
  };
}
