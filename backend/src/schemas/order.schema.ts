import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  ORDERED = 'ORDERED',             // Đã đặt
  CN_WAREHOUSE = 'CN_WAREHOUSE',   // Kho Trung
  VN_WAREHOUSE = 'VN_WAREHOUSE',   // Kho Việt
  AT_HOME = 'AT_HOME',             // Nhà
  COMPLETED = 'COMPLETED',         // Thành công
  CANCELLED = 'CANCELLED',         // Đã hủy
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',   // Chưa thanh toán
  PAID = 'PAID',       // Đã thanh toán đủ
  PARTIAL = 'PARTIAL', // Thanh toán 1 phần
}

@Schema({ _id: false })
export class OrderCustomer {
  @Prop({ required: true })
  name: string; // Tên khách hàng

  @Prop({ default: '' })
  phone: string; // Số điện thoại

  @Prop({ default: '' })
  facebookUrl: string; // Link Facebook của khách hàng (tùy chọn)

  @Prop({ default: 1 })
  quantity: number; // Số lượng món / sản phẩm khách đặt

  @Prop({ default: 0 })
  amount: number; // Tổng tiền của khách hàng này

  @Prop({ default: 0 })
  paidAmount: number; // Tiền khách hàng này đã thanh toán

  @Prop({ default: Date.now })
  orderDate: Date; // Ngày lên đơn

  @Prop({ default: OrderStatus.ORDERED, enum: OrderStatus })
  status: OrderStatus; // Trạng thái đơn: Đã đặt → Kho Trung → Kho Việt → Nhà → Thành công → Đã hủy

  @Prop({ default: PaymentStatus.UNPAID, enum: PaymentStatus })
  paymentStatus: PaymentStatus; // Trạng thái thanh toán

  @Prop({ default: '' })
  note: string; // Ghi chú

  @Prop({ default: '', trim: true })
  size?: string; // Kích cỡ / Size / Phân loại của khách đặt (vd: S, M, L, XL, 39, 40...)

  @Prop({ default: '', trim: true })
  color?: string; // Màu sắc của sản phẩm/món hàng (vd: Đen, Trắng, Be, Xanh, Hồng...)

  @Prop({ default: '', trim: true })
  address?: string; // Địa chỉ nhận hàng của khách

  @Prop({ default: 0 })
  shippingFee?: number; // Phí ship cho khách hàng này

  @Prop({ default: 0 })
  shippingFeeCnVn?: number; // Phí ship từ Trung Quốc về Việt Nam

  @Prop({ default: 0 })
  costPrice?: number; // Tiền vốn tương ứng với khách hàng này

  @Prop({ default: '' })
  imageUrl?: string; // Hình ảnh riêng của món hàng / khách đặt
}

export const OrderCustomerSchema = SchemaFactory.createForClass(OrderCustomer);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: '', trim: true })
  size?: string; // Kích cỡ / Size chung của đơn hàng / sản phẩm (nếu có)

  @Prop({ default: '', trim: true })
  color?: string; // Màu sắc chung của đơn hàng / sản phẩm (nếu có)

  @Prop({ required: true })
  orderCode: string; // Mã đơn hàng vd: ORD-1001

  @Prop({ required: true })
  title: string; // Tên đơn hàng / Tên sản phẩm

  @Prop({ default: '' })
  imageUrl: string; // Hình ảnh đơn hàng / sản phẩm

  // Danh sách các khách hàng trong đơn
  @Prop({ type: [OrderCustomerSchema], default: [] })
  customers: OrderCustomer[];

  // Tổng tiền đơn hàng (= ∑ amount của các khách)
  @Prop({ default: 0 })
  totalAmount: number;

  // Tổng tiền đã thanh toán của cả đơn (= ∑ paidAmount của các khách)
  @Prop({ default: 0 })
  paidAmount: number;

  // Tiền vốn đơn hàng (Giá vốn hàng bán)
  @Prop({ default: 0 })
  costPrice: number;

  // Phí vận chuyển (Tiền ship khách / nội địa)
  @Prop({ default: 0 })
  shippingFee: number;

  // Phí ship từ Trung Quốc về Việt Nam
  @Prop({ default: 0 })
  shippingFeeCnVn: number;

  @Prop({ default: Date.now })
  orderDate: Date;

  @Prop({ default: OrderStatus.ORDERED, enum: OrderStatus })
  status: OrderStatus;

  @Prop({ default: PaymentStatus.UNPAID, enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @Prop({ default: '' })
  customerName: string;

  @Prop({ default: '' })
  customerPhone: string;

  @Prop({ default: '', trim: true })
  customerAddress?: string;

  @Prop({ default: '', trim: true })
  customerFacebookUrl?: string;

  @Prop({ default: '', trim: true })
  address?: string;

  @Prop({ default: '', trim: true })
  facebookUrl?: string;

  @Prop({ default: '' })
  note: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ userId: 1, orderDate: -1, createdAt: -1 });
OrderSchema.index({ userId: 1, status: 1, orderDate: -1 });
OrderSchema.index({ userId: 1, orderDate: -1 });
OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ 'customers.name': 1 });
OrderSchema.index({ 'customers.phone': 1 });
OrderSchema.index({ 'customers.facebookUrl': 1 });
