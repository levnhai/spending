"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  DollarSign,
  Truck,
  Image as ImageIcon,
  Users,
  UserPlus,
  ExternalLink,
  Edit2,
  CheckCircle,
  Clock,
  UploadCloud,
  Loader2,
  Maximize2,
  Eye,
  Package,
  ShoppingBag,
  Layers,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Box,
  Shirt,
  Sparkles,
  Zap,
  Camera,
} from "lucide-react";
import {
  Order,
  OrderCustomer,
  CreateOrderPayload,
  OrderStatusType,
  PaymentStatusType,
  ORDER_STATUS_CONFIG,
  orderApi,
} from "@/entities/order";
import { Customer, customerApi } from "@/entities/customer";
import {
  formatVND,
  formatNumberWithSpaces,
  parseFormattedNumber,
} from "@/shared/lib/formatters";
import { compressImageFile } from "@/shared/lib/imageUtils";
import { uploadOrderImage, getFullImageUrl } from "@/shared/lib/uploadApi";

interface AddEditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderToEdit?: Order | null;
}

export type OrderCreationMode =
  | "SINGLE_ITEM"
  | "CUSTOMER_ITEMS"
  | "GROUP_ORDER";

interface ItemRow {
  id: string;
  name: string;
  size: string;
  color: string;
  imageUrl?: string;
  quantityStr: string;
  costPriceStr: string;
  amountStr: string;
  shippingFeeStr: string;
  paidAmountStr: string;
  note: string;
}

const createEmptyCustomer = (): OrderCustomer => ({
  name: "",
  phone: "",
  facebookUrl: "",
  address: "",
  size: "",
  color: "",
  imageUrl: "",
  quantity: 1,
  amount: 0,
  paidAmount: 0,
  orderDate: new Date().toISOString().split("T")[0],
  status: "ORDERED",
  paymentStatus: "UNPAID",
  note: "",
});

const createEmptyItemRow = (defaultName = ""): ItemRow => ({
  id: Math.random().toString(36).substring(2, 9),
  name: defaultName,
  size: "",
  color: "",
  imageUrl: "",
  quantityStr: "1",
  costPriceStr: "",
  amountStr: "",
  shippingFeeStr: "",
  paidAmountStr: "",
  note: "",
});

export const AddEditOrderModal: React.FC<AddEditOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  orderToEdit,
}) => {
  const isEditing = Boolean(orderToEdit);

  // Trạng thái bước: 'SELECT_MODE' | 'FORM'
  const [modalStep, setModalStep] = useState<"SELECT_MODE" | "FORM">(
    "SELECT_MODE",
  );

  // 3 Chế độ tạo đơn hàng
  const [orderMode, setOrderMode] = useState<OrderCreationMode>("SINGLE_ITEM");

  // Thông tin chung
  const [title, setTitle] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">(
    "upload",
  );
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [uploadingItemIdx, setUploadingItemIdx] = useState<number | null>(null);
  const [previewFullImage, setPreviewFullImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Thông tin khách hàng (dành cho SINGLE_ITEM & CUSTOMER_ITEMS)
  const [singleCustName, setSingleCustName] = useState("");
  const [singleCustPhone, setSingleCustPhone] = useState("");
  const [singleCustFacebook, setSingleCustFacebook] = useState("");
  const [singleCustAddress, setSingleCustAddress] = useState("");
  const [singleCustPaidAmountStr, setSingleCustPaidAmountStr] = useState("");

  // Dành riêng cho SINGLE_ITEM (1 Khách - 1 SP)
  const [singleItemQtyStr, setSingleItemQtyStr] = useState("1");
  const [singleItemAmountStr, setSingleItemAmountStr] = useState("");
  const [singleItemNote, setSingleItemNote] = useState("");

  // Dành riêng cho CUSTOMER_ITEMS (1 Khách - Nhiều SP)
  const [comboItems, setComboItems] = useState<ItemRow[]>([
    createEmptyItemRow(),
  ]);
  const [justAddedItemId, setJustAddedItemId] = useState<string | null>(null);

  // Dành riêng cho GROUP_ORDER (1 SP - Nhiều Khách)
  const [groupCustomers, setGroupCustomers] = useState<OrderCustomer[]>([]);
  const [groupCostPriceStr, setGroupCostPriceStr] = useState("");
  const [groupSellingPriceStr, setGroupSellingPriceStr] = useState("");

  // Chi phí
  const [costPriceStr, setCostPriceStr] = useState("");
  const [shippingFeeStr, setShippingFeeStr] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);

  // Sub-modal state for GROUP_ORDER (Thêm/sửa khách mua chung)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomerIndex, setEditingCustomerIndex] = useState<
    number | null
  >(null);
  const [custForm, setCustForm] = useState<OrderCustomer>(
    createEmptyCustomer(),
  );
  const [custQuantityStr, setCustQuantityStr] = useState("1");
  const [custCostPriceStr, setCustCostPriceStr] = useState("");
  const [custUnitPriceStr, setCustUnitPriceStr] = useState("");
  const [custShippingFeeStr, setCustShippingFeeStr] = useState("");
  const [custAmountStr, setCustAmountStr] = useState("");
  const [custPaidAmountStr, setCustPaidAmountStr] = useState("");
  const [custError, setCustError] = useState("");

  useEffect(() => {
    if (isOpen) {
      customerApi
        .getAll()
        .then((res) => setAvailableCustomers(res || []))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingImage(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 1200, 1200, 0.8);
      const savedUrl = await uploadOrderImage(compressedDataUrl);
      setImageUrl(savedUrl);
    } catch (err: any) {
      alert(err.message || "Không thể xử lý hình ảnh");
    } finally {
      setIsCompressingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Upload ảnh riêng cho từng món trong comboItems
  const handleItemFileUpload = async (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingItemIdx(idx);
    try {
      const compressedDataUrl = await compressImageFile(file, 1200, 1200, 0.8);
      const savedUrl = await uploadOrderImage(compressedDataUrl);
      handleUpdateComboItem(idx, "imageUrl", savedUrl);
    } catch (err: any) {
      alert(err.message || "Không thể tải ảnh cho món này");
    } finally {
      setUploadingItemIdx(null);
      e.target.value = "";
    }
  };

  useEffect(() => {
    if (orderToEdit) {
      setTitle(orderToEdit.title || "");
      setOrderCode(orderToEdit.orderCode || "");
      setSize(orderToEdit.size || "");
      setColor(orderToEdit.color || "");
      setImageUrl(orderToEdit.imageUrl || "");
      setCostPriceStr(
        orderToEdit.costPrice
          ? formatNumberWithSpaces(orderToEdit.costPrice)
          : "",
      );
      setShippingFeeStr(
        orderToEdit.shippingFee
          ? formatNumberWithSpaces(orderToEdit.shippingFee)
          : "",
      );

      const custs = orderToEdit.customers || [];
      const uniqueNames = new Set(
        custs.map((c) => c.name?.trim()).filter(Boolean),
      );

      if (uniqueNames.size > 1) {
        // Trường hợp 3: Gom Order
        setOrderMode("GROUP_ORDER");
        setGroupCostPriceStr(
          orderToEdit.costPrice
            ? formatNumberWithSpaces(orderToEdit.costPrice)
            : "",
        );
        setGroupSellingPriceStr(
          custs[0]?.amount ? formatNumberWithSpaces(custs[0].amount) : "",
        );
        setGroupCustomers(
          custs.map((c) => ({
            name: c.name || "",
            phone: c.phone || "",
            facebookUrl: c.facebookUrl || "",
            address: c.address || "",
            size: c.size || orderToEdit.size || "",
            color: c.color || orderToEdit.color || "",
            imageUrl: c.imageUrl || "",
            quantity:
              c.quantity && Number(c.quantity) > 0 ? Number(c.quantity) : 1,
            amount: c.amount || 0,
            paidAmount: c.paidAmount || 0,
            orderDate: c.orderDate
              ? new Date(c.orderDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            status: c.status || "ORDERED",
            paymentStatus: c.paymentStatus || "UNPAID",
            note: c.note || "",
          })),
        );
      } else if (custs.length > 1) {
        // Trường hợp 2: 1 Khách Nhiều Món
        setOrderMode("CUSTOMER_ITEMS");
        setSingleCustName(orderToEdit.customerName || custs[0]?.name || "");
        setSingleCustPhone(orderToEdit.customerPhone || custs[0]?.phone || "");
        setSingleCustFacebook(
          orderToEdit.customerFacebookUrl || custs[0]?.facebookUrl || "",
        );
        setSingleCustAddress(
          orderToEdit.customerAddress ||
            orderToEdit.address ||
            custs[0]?.address ||
            "",
        );
        setSingleCustPaidAmountStr(
          orderToEdit.paidAmount
            ? formatNumberWithSpaces(orderToEdit.paidAmount)
            : "",
        );
        setComboItems(
          custs.map((c) => ({
            id: Math.random().toString(36).substring(2, 9),
            name: c.name || "",
            size: c.size || "",
            color: c.color || "",
            imageUrl: c.imageUrl || "",
            quantityStr: String(c.quantity || 1),
            costPriceStr: orderToEdit.costPrice
              ? formatNumberWithSpaces(
                  Math.round(orderToEdit.costPrice / custs.length),
                )
              : "",
            amountStr: c.amount ? formatNumberWithSpaces(c.amount) : "",
            shippingFeeStr: orderToEdit.shippingFee
              ? formatNumberWithSpaces(
                  Math.round(orderToEdit.shippingFee / custs.length),
                )
              : "",
            paidAmountStr: c.paidAmount
              ? formatNumberWithSpaces(c.paidAmount)
              : "",
            note: c.note || "",
          })),
        );
      } else {
        // Trường hợp 1: 1 Khách 1 Sản phẩm
        setOrderMode("SINGLE_ITEM");
        setSingleCustName(orderToEdit.customerName || custs[0]?.name || "");
        setSingleCustPhone(orderToEdit.customerPhone || custs[0]?.phone || "");
        setSingleCustFacebook(
          orderToEdit.customerFacebookUrl || custs[0]?.facebookUrl || "",
        );
        setSingleCustAddress(
          orderToEdit.customerAddress ||
            orderToEdit.address ||
            custs[0]?.address ||
            "",
        );
        setSingleCustPaidAmountStr(
          orderToEdit.paidAmount
            ? formatNumberWithSpaces(orderToEdit.paidAmount)
            : "",
        );
        setSize(orderToEdit.size || custs[0]?.size || "");
        setColor(orderToEdit.color || custs[0]?.color || "");
        setImageUrl(orderToEdit.imageUrl || custs[0]?.imageUrl || "");
        setSingleItemQtyStr(String(custs[0]?.quantity || 1));
        setSingleItemAmountStr(
          orderToEdit.totalAmount
            ? formatNumberWithSpaces(orderToEdit.totalAmount)
            : custs[0]?.amount
              ? formatNumberWithSpaces(custs[0].amount)
              : "",
        );
        setSingleItemNote(custs[0]?.note || orderToEdit.note || "");
      }

      setModalStep("FORM");
    } else {
      // Tạo mới: reset sạch
      setOrderMode("SINGLE_ITEM");
      setModalStep("SELECT_MODE");
      setTitle("");
      setOrderCode("");
      setSize("");
      setColor("");
      setImageUrl("");
      setCostPriceStr("");
      setShippingFeeStr("");
      setSingleCustName("");
      setSingleCustPhone("");
      setSingleCustFacebook("");
      setSingleCustAddress("");
      setSingleCustPaidAmountStr("");
      setSingleItemQtyStr("1");
      setSingleItemAmountStr("");
      setSingleItemNote("");
      setComboItems([createEmptyItemRow()]);
      setGroupCustomers([]);
      setGroupCostPriceStr("");
      setGroupSellingPriceStr("");
    }
    setError("");
  }, [orderToEdit, isOpen]);

  if (!isOpen) return null;

  const costPrice = parseFormattedNumber(costPriceStr);
  const shippingFee = parseFormattedNumber(shippingFeeStr);

  // Tính tổng tiền & chi phí dựa theo mode
  let calculatedTotalAmount = 0;
  let calculatedPaidAmount = 0;
  let calculatedCostPrice = 0;
  let calculatedShippingFee = 0;

  if (orderMode === "SINGLE_ITEM") {
    calculatedTotalAmount = parseFormattedNumber(singleItemAmountStr);
    calculatedPaidAmount = parseFormattedNumber(singleCustPaidAmountStr);
    calculatedCostPrice = costPrice;
    calculatedShippingFee = shippingFee;
  } else if (orderMode === "CUSTOMER_ITEMS") {
    calculatedTotalAmount = comboItems.reduce(
      (sum, item) => sum + parseFormattedNumber(item.amountStr),
      0,
    );
    calculatedPaidAmount = comboItems.reduce(
      (sum, item) => sum + parseFormattedNumber(item.paidAmountStr),
      0,
    );
    calculatedCostPrice = comboItems.reduce(
      (sum, item) => sum + parseFormattedNumber(item.costPriceStr),
      0,
    );
    calculatedShippingFee = comboItems.reduce(
      (sum, item) => sum + parseFormattedNumber(item.shippingFeeStr),
      0,
    );
  } else if (orderMode === "GROUP_ORDER") {
    calculatedTotalAmount = groupCustomers.reduce(
      (sum, c) => sum + (Number(c.amount) || 0),
      0,
    );
    calculatedPaidAmount = groupCustomers.reduce(
      (sum, c) => sum + (Number(c.paidAmount) || 0),
      0,
    );
    calculatedShippingFee = groupCustomers.reduce(
      (sum, c) => sum + (Number(c.shippingFee) || 0),
      0,
    );
    const unitCost = parseFormattedNumber(groupCostPriceStr);
    const totalGroupQty = groupCustomers.reduce(
      (sum, c) => sum + (Number(c.quantity) || 1),
      0,
    );
    const hasCustomCost = groupCustomers.some((c) => (c.costPrice || 0) > 0);
    calculatedCostPrice = hasCustomCost
      ? groupCustomers.reduce((sum, c) => sum + (Number(c.costPrice) || 0), 0)
      : unitCost > 0
        ? unitCost * totalGroupQty
        : 0;
  }

  const calculatedRemaining = Math.max(
    0,
    calculatedTotalAmount - calculatedPaidAmount,
  );
  const estimatedProfit =
    calculatedTotalAmount - calculatedShippingFee - calculatedCostPrice;

  // Quản lý Combo Items (1 Khách Nhiều SP)
  const handleAddComboItem = () => {
    const newItem = createEmptyItemRow();
    setComboItems((prev) => [...prev, newItem]);
    setJustAddedItemId(newItem.id);

    setTimeout(() => {
      const el = document.getElementById(`combo-item-${newItem.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const nameInput = el.querySelector(
          'input[data-item-name="true"]',
        ) as HTMLInputElement;
        if (nameInput) nameInput.focus();
      }
    }, 100);

    setTimeout(() => {
      setJustAddedItemId(null);
    }, 1800);
  };

  const handleRemoveComboItem = (index: number) => {
    if (comboItems.length <= 1) return;
    setComboItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateComboItem = (
    index: number,
    field: keyof ItemRow,
    value: any,
  ) => {
    setComboItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Hàm tự động tính Tiền cần thu khi thay đổi Đơn giá, Số lượng hoặc Tiền ship: Tiền cần thu = (Giá bán ra * SL) + Tiền ship
  const autoCalculateGroupCustAmount = (
    unitPriceStr: string,
    qtyStr: string,
    shipStr: string,
  ) => {
    const unitPrice = parseFormattedNumber(unitPriceStr);
    const qty = Math.max(1, parseInt(qtyStr) || 1);
    const ship = parseFormattedNumber(shipStr);
    const total = unitPrice * qty + ship;
    setCustAmountStr(total > 0 ? formatNumberWithSpaces(total) : "");
  };

  // Quản lý Khách Gom (1 SP Nhiều Khách)
  const handleOpenAddGroupCustomer = () => {
    setEditingCustomerIndex(null);
    setCustForm(createEmptyCustomer());
    setCustQuantityStr("1");
    setCustCostPriceStr(groupCostPriceStr);
    const defaultSelling = parseFormattedNumber(groupSellingPriceStr);
    const formattedSelling =
      defaultSelling > 0 ? formatNumberWithSpaces(defaultSelling) : "";
    setCustUnitPriceStr(formattedSelling);
    setCustShippingFeeStr("");
    setCustAmountStr(formattedSelling);
    setCustPaidAmountStr("");
    setCustError("");
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditGroupCustomer = (index: number) => {
    const target = groupCustomers[index];
    if (!target) return;
    setEditingCustomerIndex(index);
    setCustForm({ ...target });
    const qty = target.quantity || 1;
    setCustQuantityStr(String(qty));

    // Giá gốc
    const cost = target.costPrice || 0;
    const unitCost =
      cost > 0
        ? Math.round(cost / qty)
        : parseFormattedNumber(groupCostPriceStr);
    setCustCostPriceStr(unitCost > 0 ? formatNumberWithSpaces(unitCost) : "");

    // Tiền ship
    const ship = target.shippingFee || 0;
    setCustShippingFeeStr(ship > 0 ? formatNumberWithSpaces(ship) : "");

    // Đơn giá bán ra
    const totalAmt = target.amount || 0;
    const unitSell =
      totalAmt > ship
        ? Math.round((totalAmt - ship) / qty)
        : parseFormattedNumber(groupSellingPriceStr);
    setCustUnitPriceStr(unitSell > 0 ? formatNumberWithSpaces(unitSell) : "");

    // Tiền cần thu
    setCustAmountStr(
      target.amount ? formatNumberWithSpaces(target.amount) : "",
    );

    // Tiền cọc
    setCustPaidAmountStr(
      target.paidAmount ? formatNumberWithSpaces(target.paidAmount) : "",
    );
    setCustError("");
    setIsCustomerModalOpen(true);
  };

  const handleSaveGroupCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name.trim()) {
      setCustError("Vui lòng nhập họ và tên khách hàng");
      return;
    }
    if (!custForm.address?.trim()) {
      setCustError("Vui lòng nhập địa chỉ nhận hàng của khách");
      return;
    }

    const qty = Math.max(1, parseInt(custQuantityStr) || 1);
    const unitPrice = parseFormattedNumber(custUnitPriceStr);
    const ship = parseFormattedNumber(custShippingFeeStr);
    const calculatedTotal = unitPrice * qty + ship;
    const total =
      calculatedTotal > 0
        ? calculatedTotal
        : parseFormattedNumber(custAmountStr);

    const paid = parseFormattedNumber(custPaidAmountStr);
    const unitCost =
      parseFormattedNumber(custCostPriceStr) ||
      parseFormattedNumber(groupCostPriceStr);
    const cost = unitCost > 0 ? unitCost * qty : 0;
    let paymentStatus: PaymentStatusType = custForm.paymentStatus || "UNPAID";

    if (paid >= total && total > 0) {
      paymentStatus = "PAID";
    } else if (paid > 0) {
      paymentStatus = "PARTIAL";
    } else {
      paymentStatus = "UNPAID";
    }

    const newCust: OrderCustomer = {
      ...custForm,
      name: custForm.name.trim(),
      phone: custForm.phone?.trim() || "",
      facebookUrl: custForm.facebookUrl?.trim() || "",
      address: custForm.address?.trim() || "",
      size: custForm.size?.trim() || size.trim() || "",
      color: custForm.color?.trim() || color.trim() || "",
      imageUrl: custForm.imageUrl?.trim() || "",
      quantity: qty,
      amount: total,
      paidAmount: paid,
      shippingFee: ship,
      costPrice: cost,
      paymentStatus,
      status: custForm.status || "ORDERED",
      orderDate: custForm.orderDate || new Date().toISOString().split("T")[0],
      note: custForm.note?.trim() || "",
    };

    if (editingCustomerIndex !== null) {
      setGroupCustomers((prev) => {
        const next = [...prev];
        next[editingCustomerIndex] = newCust;
        return next;
      });
    } else {
      setGroupCustomers((prev) => [...prev, newCust]);
    }

    setIsCustomerModalOpen(false);
  };

  const handleRemoveGroupCustomer = (index: number) => {
    setGroupCustomers((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Order Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (orderMode === "SINGLE_ITEM") {
      if (!singleCustName.trim()) {
        setError("Vui lòng nhập họ và tên khách hàng");
        return;
      }
      if (!singleCustAddress.trim()) {
        setError("Vui lòng nhập địa chỉ nhận hàng của khách (bắt buộc)");
        return;
      }
      if (!title.trim()) {
        setError("Vui lòng nhập tên sản phẩm / món hàng");
        return;
      }
      if (
        !singleItemAmountStr ||
        parseFormattedNumber(singleItemAmountStr) <= 0
      ) {
        setError("Vui lòng nhập giá bán sản phẩm");
        return;
      }
    } else if (orderMode === "CUSTOMER_ITEMS") {
      if (!singleCustName.trim()) {
        setError("Vui lòng nhập họ và tên khách hàng");
        return;
      }
      if (!singleCustAddress.trim()) {
        setError("Vui lòng nhập địa chỉ nhận hàng của khách (bắt buộc)");
        return;
      }
      const validItems = comboItems.filter((it) => it.name.trim());
      if (validItems.length === 0) {
        setError("Vui lòng nhập tên ít nhất 1 món hàng cho khách");
        return;
      }
    } else {
      if (!title.trim()) {
        setError("Vui lòng nhập tên sản phẩm lô / đợt gom");
        return;
      }
      if (groupCustomers.length === 0) {
        setError("Vui lòng thêm ít nhất 1 khách hàng vào đợt gom order");
        return;
      }
    }

    try {
      if (isEditing && orderToEdit) {
        // Khi chỉnh sửa 1 đơn hàng có sẵn
        let updatePayload: CreateOrderPayload;
        if (orderMode === "SINGLE_ITEM") {
          const itemAmount = parseFormattedNumber(singleItemAmountStr);
          const itemPaid = parseFormattedNumber(singleCustPaidAmountStr);
          const itemQty = Math.max(1, parseInt(singleItemQtyStr) || 1);
          let pStatus: PaymentStatusType = "UNPAID";
          if (itemPaid >= itemAmount && itemAmount > 0) pStatus = "PAID";
          else if (itemPaid > 0) pStatus = "PARTIAL";

          updatePayload = {
            title: title.trim(),
            orderCode: orderCode.trim() || undefined,
            size: size.trim() || undefined,
            color: color.trim() || undefined,
            imageUrl: imageUrl.trim() || undefined,
            costPrice: costPrice,
            shippingFee: shippingFee,
            customerName: singleCustName.trim(),
            customerPhone: singleCustPhone.trim() || undefined,
            customerAddress: singleCustAddress.trim() || undefined,
            address: singleCustAddress.trim() || undefined,
            customerFacebookUrl: singleCustFacebook.trim() || undefined,
            facebookUrl: singleCustFacebook.trim() || undefined,
            totalAmount: itemAmount,
            paidAmount: itemPaid,
            paymentStatus: pStatus,
            status: "ORDERED",
            note: singleItemNote.trim() || undefined,
            customers: [
              {
                name: singleCustName.trim(),
                phone: singleCustPhone.trim() || undefined,
                facebookUrl: singleCustFacebook.trim() || undefined,
                address: singleCustAddress.trim() || undefined,
                size: size.trim() || undefined,
                color: color.trim() || undefined,
                imageUrl: imageUrl.trim() || undefined,
                quantity: itemQty,
                amount: itemAmount,
                paidAmount: itemPaid,
                paymentStatus: pStatus,
                status: "ORDERED",
                orderDate: new Date().toISOString(),
                note: singleItemNote.trim() || undefined,
              },
            ],
          };
        } else if (orderMode === "CUSTOMER_ITEMS") {
          const validItems = comboItems.filter((it) => it.name.trim());
          const totalAmt = validItems.reduce(
            (sum, it) => sum + parseFormattedNumber(it.amountStr),
            0,
          );
          const totalCost = validItems.reduce(
            (sum, it) => sum + parseFormattedNumber(it.costPriceStr),
            0,
          );
          const totalShip = validItems.reduce(
            (sum, it) => sum + parseFormattedNumber(it.shippingFeeStr),
            0,
          );
          const totalPaid = validItems.reduce(
            (sum, it) => sum + parseFormattedNumber(it.paidAmountStr),
            0,
          );
          let pStatus: PaymentStatusType = "UNPAID";
          if (totalPaid >= totalAmt && totalAmt > 0) pStatus = "PAID";
          else if (totalPaid > 0) pStatus = "PARTIAL";

          updatePayload = {
            title: validItems[0]?.name || title.trim(),
            orderCode: orderCode.trim() || undefined,
            size: validItems[0]?.size?.trim() || undefined,
            color: validItems[0]?.color?.trim() || undefined,
            imageUrl:
              validItems.find((it) => it.imageUrl)?.imageUrl ||
              imageUrl.trim() ||
              undefined,
            costPrice: totalCost,
            shippingFee: totalShip,
            customerName: singleCustName.trim(),
            customerPhone: singleCustPhone.trim() || undefined,
            customerAddress: singleCustAddress.trim() || undefined,
            address: singleCustAddress.trim() || undefined,
            customerFacebookUrl: singleCustFacebook.trim() || undefined,
            facebookUrl: singleCustFacebook.trim() || undefined,
            totalAmount: totalAmt,
            paidAmount: totalPaid,
            paymentStatus: pStatus,
            status: "ORDERED",
            customers: validItems.map((it) => ({
              name: it.name.trim(),
              phone: singleCustPhone.trim() || undefined,
              facebookUrl: singleCustFacebook.trim() || undefined,
              address: singleCustAddress.trim() || undefined,
              size: it.size.trim() || undefined,
              color: it.color.trim() || undefined,
              imageUrl: it.imageUrl?.trim() || undefined,
              quantity: Math.max(1, parseInt(it.quantityStr) || 1),
              amount: parseFormattedNumber(it.amountStr),
              paidAmount: parseFormattedNumber(it.paidAmountStr),
              paymentStatus:
                parseFormattedNumber(it.paidAmountStr) >=
                  parseFormattedNumber(it.amountStr) &&
                parseFormattedNumber(it.amountStr) > 0
                  ? "PAID"
                  : parseFormattedNumber(it.paidAmountStr) > 0
                    ? "PARTIAL"
                    : "UNPAID",
              status: "ORDERED",
              orderDate: new Date().toISOString(),
              note: it.note.trim() || undefined,
            })),
          };
        } else {
          updatePayload = {
            title: title.trim(),
            orderCode: orderCode.trim() || undefined,
            size: size.trim() || undefined,
            color: color.trim() || undefined,
            imageUrl: imageUrl.trim() || undefined,
            costPrice: costPrice,
            shippingFee: shippingFee,
            totalAmount: calculatedTotalAmount,
            paidAmount: calculatedPaidAmount,
            customers: groupCustomers.map((c) => ({
              ...c,
              size: c.size?.trim() || size.trim() || undefined,
              color: c.color?.trim() || color.trim() || undefined,
              imageUrl: c.imageUrl?.trim() || undefined,
              orderDate: c.orderDate
                ? new Date(c.orderDate).toISOString()
                : new Date().toISOString(),
            })),
          };
        }
        await orderApi.update(orderToEdit._id, updatePayload);
      } else {
        // TẠO MỚI: TỰ ĐỘNG TÁCH THÀNH CÁC ĐƠN HÀNG ĐỘC LẬP (MỖI MÓN / MỖI KHÁCH = 1 ĐƠN HÀNG)
        if (orderMode === "CUSTOMER_ITEMS") {
          const validItems = comboItems.filter((it) => it.name.trim());
          const payloads: CreateOrderPayload[] = validItems.map((it, idx) => {
            const itAmt = parseFormattedNumber(it.amountStr);
            const itCost = parseFormattedNumber(it.costPriceStr);
            const itShip = parseFormattedNumber(it.shippingFeeStr);
            const itPaid = parseFormattedNumber(it.paidAmountStr);
            const itQty = Math.max(1, parseInt(it.quantityStr) || 1);

            let pStatus: PaymentStatusType = "UNPAID";
            if (itPaid >= itAmt && itAmt > 0) pStatus = "PAID";
            else if (itPaid > 0) pStatus = "PARTIAL";

            return {
              title: it.name.trim(),
              orderCode: orderCode.trim()
                ? validItems.length > 1
                  ? `${orderCode.trim()}-${idx + 1}`
                  : orderCode.trim()
                : undefined,
              size: it.size.trim() || undefined,
              color: it.color.trim() || undefined,
              imageUrl: it.imageUrl?.trim() || undefined,
              costPrice: itCost,
              shippingFee: itShip,
              customerName: singleCustName.trim(),
              customerPhone: singleCustPhone.trim() || undefined,
              customerAddress: singleCustAddress.trim() || undefined,
              address: singleCustAddress.trim() || undefined,
              customerFacebookUrl: singleCustFacebook.trim() || undefined,
              facebookUrl: singleCustFacebook.trim() || undefined,
              totalAmount: itAmt,
              paidAmount: itPaid,
              paymentStatus: pStatus,
              status: "ORDERED",
              note:
                it.note.trim() ||
                (singleCustAddress ? `Đ/C: ${singleCustAddress}` : undefined),
              customers: [
                {
                  name: singleCustName.trim(),
                  phone: singleCustPhone.trim() || undefined,
                  facebookUrl: singleCustFacebook.trim() || undefined,
                  address: singleCustAddress.trim() || undefined,
                  size: it.size.trim() || undefined,
                  color: it.color.trim() || undefined,
                  imageUrl: it.imageUrl?.trim() || undefined,
                  quantity: itQty,
                  amount: itAmt,
                  paidAmount: itPaid,
                  paymentStatus: pStatus,
                  status: "ORDERED",
                  orderDate: new Date().toISOString(),
                  note:
                    it.note.trim() ||
                    (singleCustAddress
                      ? `Đ/C: ${singleCustAddress}`
                      : undefined),
                },
              ],
            };
          });

          await Promise.all(payloads.map((p) => orderApi.create(p)));
        } else if (orderMode === "GROUP_ORDER") {
          const unitCost = parseFormattedNumber(groupCostPriceStr);
          const payloads: CreateOrderPayload[] = groupCustomers.map(
            (c, idx) => {
              const cAmt = Number(c.amount) || 0;
              const cPaid = Number(c.paidAmount) || 0;
              const cQty = Number(c.quantity) || 1;
              const cCost = unitCost > 0 ? unitCost * cQty : 0;

              const cShip = Number(c.shippingFee) || 0;

              let pStatus: PaymentStatusType = c.paymentStatus || "UNPAID";
              if (cPaid >= cAmt && cAmt > 0) pStatus = "PAID";
              else if (cPaid > 0) pStatus = "PARTIAL";

              return {
                title: title.trim(),
                orderCode: orderCode.trim()
                  ? groupCustomers.length > 1
                    ? `${orderCode.trim()}-${idx + 1}`
                    : orderCode.trim()
                  : undefined,
                size: c.size?.trim() || undefined,
                color: c.color?.trim() || undefined,
                imageUrl: c.imageUrl?.trim() || imageUrl.trim() || undefined,
                costPrice: cCost,
                shippingFee: cShip,
                customerName: c.name.trim(),
                customerPhone: c.phone?.trim() || undefined,
                customerAddress: c.address?.trim() || undefined,
                address: c.address?.trim() || undefined,
                customerFacebookUrl: c.facebookUrl?.trim() || undefined,
                facebookUrl: c.facebookUrl?.trim() || undefined,
                totalAmount: cAmt,
                paidAmount: cPaid,
                paymentStatus: pStatus,
                status: c.status || "ORDERED",
                note: c.note?.trim() || undefined,
                customers: [
                  {
                    ...c,
                    costPrice: cCost,
                    shippingFee: cShip,
                    size: c.size?.trim() || undefined,
                    color: c.color?.trim() || undefined,
                    imageUrl: c.imageUrl?.trim() || undefined,
                    orderDate: c.orderDate
                      ? new Date(c.orderDate).toISOString()
                      : new Date().toISOString(),
                  },
                ],
              };
            },
          );

          await Promise.all(payloads.map((p) => orderApi.create(p)));
        } else {
          // SINGLE_ITEM: 1 Đơn lẻ
          const itemAmount = parseFormattedNumber(singleItemAmountStr);
          const itemPaid = parseFormattedNumber(singleCustPaidAmountStr);
          const itemQty = Math.max(1, parseInt(singleItemQtyStr) || 1);

          let pStatus: PaymentStatusType = "UNPAID";
          if (itemPaid >= itemAmount && itemAmount > 0) pStatus = "PAID";
          else if (itemPaid > 0) pStatus = "PARTIAL";

          const singlePayload: CreateOrderPayload = {
            title: title.trim(),
            orderCode: orderCode.trim() || undefined,
            size: size.trim() || undefined,
            color: color.trim() || undefined,
            imageUrl: imageUrl.trim() || undefined,
            costPrice: costPrice,
            shippingFee: shippingFee,
            customerName: singleCustName.trim(),
            customerPhone: singleCustPhone.trim() || undefined,
            customerAddress: singleCustAddress.trim() || undefined,
            address: singleCustAddress.trim() || undefined,
            customerFacebookUrl: singleCustFacebook.trim() || undefined,
            facebookUrl: singleCustFacebook.trim() || undefined,
            totalAmount: itemAmount,
            paidAmount: itemPaid,
            paymentStatus: pStatus,
            status: "ORDERED",
            note: singleItemNote.trim() || undefined,
            customers: [
              {
                name: singleCustName.trim(),
                phone: singleCustPhone.trim() || undefined,
                facebookUrl: singleCustFacebook.trim() || undefined,
                address: singleCustAddress.trim() || undefined,
                size: size.trim() || undefined,
                color: color.trim() || undefined,
                imageUrl: imageUrl.trim() || undefined,
                quantity: itemQty,
                amount: itemAmount,
                paidAmount: itemPaid,
                paymentStatus: pStatus,
                status: "ORDERED",
                orderDate: new Date().toISOString(),
                note:
                  singleItemNote.trim() ||
                  (singleCustAddress ? `Đ/C: ${singleCustAddress}` : undefined),
              },
            ],
          };

          await orderApi.create(singlePayload);
        }
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Có lỗi xảy ra khi lưu đơn hàng",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ============================================================ */}
      {/* BƯỚC 1: MODAL CHỌN LOẠI HÌNH ĐƠN HÀNG (3 THẺ CAO CẤP)        */}
      {/* ============================================================ */}
      {!isEditing && modalStep === "SELECT_MODE" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1329] sm:bg-[#0d1527] w-full max-w-3xl rounded-3xl border border-slate-800/90 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150 text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg sm:text-2xl text-white tracking-tight flex items-center gap-2">
                  <span>Chọn loại hình đơn hàng</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Lựa chọn hình thức tạo đơn phù hợp với đợt bán hàng của bạn
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 LỰA CHỌN DẠNG THẺ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Thẻ 1: 1 Khách - 1 Sản Phẩm (Đơn lẻ nhanh) */}
              <div
                onClick={() => {
                  setOrderMode("SINGLE_ITEM");
                  setModalStep("FORM");
                }}
                className="group relative rounded-3xl p-5 border border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500/25 transition-all">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                      1 Khách - 1 Sản phẩm
                    </h4>
                    <p className="text-[11px] text-cyan-400/80 font-semibold mt-0.5">
                      Đơn lẻ nhanh (5 giây)
                    </p>
                    <p className="text-xs text-slate-300/80 leading-relaxed mt-2">
                      Bán lẻ 1 món duy nhất cho 1 khách hàng. Điền trực tiếp
                      trên 1 màn hình.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-cyan-500/20 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  <span>Tạo đơn 1 món</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>

              {/* Thẻ 2: 1 Khách - Nhiều Sản Phẩm (Đơn Combo) */}
              <div
                onClick={() => {
                  setOrderMode("CUSTOMER_ITEMS");
                  setModalStep("FORM");
                }}
                className="group relative rounded-3xl p-5 border border-indigo-500/30 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/40 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/25 transition-all">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors">
                      1 Khách - Nhiều SP
                    </h4>
                    <p className="text-[11px] text-indigo-400/80 font-semibold mt-0.5">
                      Đơn Combo / Nhiều món
                    </p>
                    <p className="text-xs text-slate-300/80 leading-relaxed mt-2">
                      1 khách đặt mua nhiều món (Áo, Quần, Giày...) với hình
                      ảnh, size và giá riêng.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-indigo-500/20 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                  <span>Tạo đơn Combo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>

              {/* Thẻ 3: 1 Sản Phẩm - Nhiều Khách (Gom Order) */}
              <div
                onClick={() => {
                  setOrderMode("GROUP_ORDER");
                  setModalStep("FORM");
                }}
                className="group relative rounded-3xl p-5 border border-emerald-500/30 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/25 transition-all">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
                      1 SP - Nhiều khách
                    </h4>
                    <p className="text-[11px] text-emerald-400/80 font-semibold mt-0.5">
                      Gom Order / Mua chung
                    </p>
                    <p className="text-xs text-slate-300/80 leading-relaxed mt-2">
                      Gom 1 mẫu/sản phẩm theo đợt cho nhiều khách cùng đăng ký
                      mua chung.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                  <span>Tạo đợt Gom</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* BƯỚC 2: MAIN FORM MODAL ĐIỀN THÔNG TIN ĐƠN HÀNG              */
        /* ============================================================ */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setModalStep("SELECT_MODE")}
                    className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer mr-0.5"
                    title="Quay lại chọn loại hình"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div
                  className={`p-2 rounded-2xl ${
                    orderMode === "SINGLE_ITEM"
                      ? "bg-cyan-500/10 text-cyan-500"
                      : orderMode === "CUSTOMER_ITEMS"
                        ? "bg-indigo-500/10 text-indigo-500"
                        : "bg-emerald-500/10 text-emerald-500"
                  }`}
                >
                  {orderMode === "SINGLE_ITEM" ? (
                    <Zap className="w-5 h-5" />
                  ) : orderMode === "CUSTOMER_ITEMS" ? (
                    <ShoppingBag className="w-5 h-5" />
                  ) : (
                    <Box className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>
                      {isEditing ? "Chỉnh Sửa Đơn Hàng" : "Tạo Đơn Hàng"}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold border ${
                        orderMode === "SINGLE_ITEM"
                          ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20"
                          : orderMode === "CUSTOMER_ITEMS"
                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {orderMode === "SINGLE_ITEM"
                        ? "1 Khách - 1 Món"
                        : orderMode === "CUSTOMER_ITEMS"
                          ? "1 Khách - Nhiều Món"
                          : "Gom Order Mua Chung"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {orderMode === "SINGLE_ITEM"
                      ? "Đơn lẻ 1 sản phẩm cho 1 khách hàng (điền nhanh)"
                      : orderMode === "CUSTOMER_ITEMS"
                        ? "Đơn combo nhiều món với hình ảnh riêng cho từng món"
                        : "Đợt gom 1 sản phẩm cho nhiều khách mua chung"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 overflow-y-auto flex-1 text-xs"
            >
              {error && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-semibold">
                  {error}
                </div>
              )}

              {/* THANH CHUYỂN NHANH 3 CHẾ ĐỘ TRONG FORM */}
              {!isEditing && (
                <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setOrderMode("SINGLE_ITEM")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      orderMode === "SINGLE_ITEM"
                        ? "bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span className="truncate">1 Khách 1 SP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderMode("CUSTOMER_ITEMS")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      orderMode === "CUSTOMER_ITEMS"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span className="truncate">1 Khách Nhiều SP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderMode("GROUP_ORDER")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      orderMode === "GROUP_ORDER"
                        ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span className="truncate">Gom Nhiều Khách</span>
                  </button>
                </div>
              )}

              {/* ========================================================= */}
              {/* TRƯỜNG HỢP 1: 1 KHÁCH - 1 SẢN PHẨM (ĐIỀN TRỰC TIẾP SIÊU NHANH) */}
              {/* ========================================================= */}
              {orderMode === "SINGLE_ITEM" && (
                <>
                  {/* Khối Thông Tin Khách Hàng */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        Thông Tin Khách Hàng
                      </span>
                    </div>

                    {availableCustomers.length > 0 && (
                      <select
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          if (!selectedId) return;
                          const found = availableCustomers.find(
                            (c) => c._id === selectedId,
                          );
                          if (found) {
                            setSingleCustName(found.name);
                            if (found.phone) setSingleCustPhone(found.phone);
                            if (found.facebookUrl)
                              setSingleCustFacebook(found.facebookUrl);
                            if (found.address)
                              setSingleCustAddress(found.address);
                          }
                        }}
                        defaultValue=""
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-cyan-500/30 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-cyan-500/40 outline-none text-xs cursor-pointer"
                      >
                        <option value="">
                          💡 -- Chọn nhanh từ danh bạ khách quen (
                          {availableCustomers.length}) --
                        </option>
                        {availableCustomers.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} {c.phone ? `(${c.phone})` : ""}
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Tên khách hàng{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={singleCustName}
                          onChange={(e) => setSingleCustName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                          required
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-cyan-500/40 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Số điện thoại
                        </label>
                        <input
                          type="text"
                          value={singleCustPhone}
                          onChange={(e) => setSingleCustPhone(e.target.value)}
                          placeholder="0912 345 678"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-cyan-500/40 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Link Facebook (tùy chọn)
                        </label>
                        <input
                          type="url"
                          value={singleCustFacebook}
                          onChange={(e) =>
                            setSingleCustFacebook(e.target.value)
                          }
                          placeholder="https://facebook.com/username"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-cyan-500/40 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Địa chỉ giao hàng{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={singleCustAddress}
                          onChange={(e) => setSingleCustAddress(e.target.value)}
                          placeholder="Số nhà, đường, quận/huyện... (bắt buộc)"
                          required
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-cyan-500/40 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Khối Thông Tin Sản Phẩm 1 Món */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <span className="font-bold text-xs text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Shirt className="w-4 h-4" />
                      Thông Tin Sản Phẩm
                    </span>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Tên sản phẩm / món hàng{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ví dụ: Áo polo phối viền, Giày sneaker cổ cao..."
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-cyan-500/40 outline-none"
                      />
                    </div>

                    {/* Size Selector & Color Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Size Selector */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Kích cỡ / Size
                        </label>
                        <div className="flex items-center gap-1 flex-wrap mb-2">
                          {["S", "M", "L", "XL", "2XL", "3XL", "Free"].map(
                            (s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setSize(size === s ? "" : s)}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  size === s
                                    ? "bg-cyan-500 text-white shadow-sm ring-2 ring-cyan-500/30"
                                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                              >
                                {s}
                              </button>
                            ),
                          )}
                        </div>
                        <input
                          type="text"
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                          placeholder="Hoặc gõ size (VD: 39, 40...)"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500/40 outline-none"
                        />
                      </div>

                      {/* Color Selector */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Màu sắc / Phân loại màu
                        </label>
                        <div className="flex items-center gap-1 flex-wrap mb-2">
                          {[
                            "Đen",
                            "Trắng",
                            "Be",
                            "Xám",
                            "Xanh",
                            "Hồng",
                            "Nâu",
                          ].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setColor(color === c ? "" : c)}
                              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                color === c
                                  ? "bg-cyan-500 text-white shadow-sm ring-2 ring-cyan-500/30"
                                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          placeholder="Hoặc gõ màu (VD: Đen nhám, Xanh rêu...)"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500/40 outline-none"
                        />
                      </div>
                    </div>

                    {/* Số lượng & Giá bán */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Số lượng
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              const current = Math.max(
                                1,
                                parseInt(singleItemQtyStr) || 1,
                              );
                              if (current > 1)
                                setSingleItemQtyStr(String(current - 1));
                            }}
                            className="w-9 h-10 rounded-l-xl bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={singleItemQtyStr}
                            onChange={(e) =>
                              setSingleItemQtyStr(
                                e.target.value.replace(/\D/g, ""),
                              )
                            }
                            onBlur={() => {
                              if (
                                !singleItemQtyStr ||
                                parseInt(singleItemQtyStr) < 1
                              ) {
                                setSingleItemQtyStr("1");
                              }
                            }}
                            className="w-full h-10 text-center bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const current = Math.max(
                                1,
                                parseInt(singleItemQtyStr) || 1,
                              );
                              setSingleItemQtyStr(String(current + 1));
                            }}
                            className="w-9 h-10 rounded-r-xl bg-slate-100 dark:bg-slate-800 border border-l-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Giá bán / Thành tiền{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          {parseFormattedNumber(singleItemAmountStr) > 0 && (
                            <span className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded-md">
                              {formatVND(
                                parseFormattedNumber(singleItemAmountStr),
                              )}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={14}
                          value={singleItemAmountStr}
                          onChange={(e) =>
                            setSingleItemAmountStr(
                              e.target.value.replace(/\D/g, "").slice(0, 14),
                            )
                          }
                          placeholder="0"
                          required
                          className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-cyan-500/40 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Khối Chi Phí & Thanh Toán */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <span className="font-bold text-xs text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      Chi Phí & Thanh Toán
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Tiền vốn nhập
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={14}
                          value={costPriceStr}
                          onChange={(e) =>
                            setCostPriceStr(
                              e.target.value.replace(/\D/g, "").slice(0, 14),
                            )
                          }
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-amber-500 font-bold outline-none text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Phí ship khách
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={14}
                          value={shippingFeeStr}
                          onChange={(e) =>
                            setShippingFeeStr(
                              e.target.value.replace(/\D/g, "").slice(0, 14),
                            )
                          }
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-500 font-bold outline-none text-xs"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Khách đã trả/cọc
                          </label>
                          {parseFormattedNumber(singleItemAmountStr) > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setSingleCustPaidAmountStr(singleItemAmountStr)
                              }
                              className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline font-bold cursor-pointer"
                            >
                              Trả đủ
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={14}
                          value={singleCustPaidAmountStr}
                          onChange={(e) =>
                            setSingleCustPaidAmountStr(
                              e.target.value.replace(/\D/g, "").slice(0, 14),
                            )
                          }
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-500 font-bold outline-none text-xs text-right"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ========================================================= */}
              {/* TRƯỜNG HỢP 2: 1 KHÁCH - NHIỀU SẢN PHẨM (MỖI MÓN CÓ ẢNH RIÊNG) */}
              {/* ========================================================= */}
              {orderMode === "CUSTOMER_ITEMS" && (
                <>
                  {/* Khối Thông Tin Khách Hàng */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      Thông Tin Khách Hàng
                    </span>

                    {availableCustomers.length > 0 && (
                      <select
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          if (!selectedId) return;
                          const found = availableCustomers.find(
                            (c) => c._id === selectedId,
                          );
                          if (found) {
                            setSingleCustName(found.name);
                            if (found.phone) setSingleCustPhone(found.phone);
                            if (found.facebookUrl)
                              setSingleCustFacebook(found.facebookUrl);
                            if (found.address)
                              setSingleCustAddress(found.address);
                          }
                        }}
                        defaultValue=""
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/30 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500/40 outline-none text-xs cursor-pointer"
                      >
                        <option value="">
                          💡 -- Chọn nhanh từ danh bạ khách quen (
                          {availableCustomers.length}) --
                        </option>
                        {availableCustomers.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} {c.phone ? `(${c.phone})` : ""}
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Tên khách hàng{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={singleCustName}
                          onChange={(e) => setSingleCustName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                          required
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/40 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Số điện thoại
                        </label>
                        <input
                          type="text"
                          value={singleCustPhone}
                          onChange={(e) => setSingleCustPhone(e.target.value)}
                          placeholder="0912 345 678"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/40 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Link Facebook / Liên hệ
                        </label>
                        <input
                          type="url"
                          value={singleCustFacebook}
                          onChange={(e) =>
                            setSingleCustFacebook(e.target.value)
                          }
                          placeholder="https://facebook.com/username"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/40 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Địa chỉ giao hàng{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={singleCustAddress}
                          onChange={(e) => setSingleCustAddress(e.target.value)}
                          placeholder="Số nhà, đường, quận/huyện... (bắt buộc)"
                          required
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/40 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Khối Danh Sách Món Hàng Của Khách (Mỗi món có Ảnh riêng) */}
                  <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            Danh Sách Món Hàng ({comboItems.length})
                          </span>
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate hidden sm:block">
                          Mỗi món có thể thêm ảnh minh họa và kích cỡ riêng
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddComboItem}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-500/20 transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm món khác</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {comboItems.map((item, idx) => {
                        const isJustAdded = item.id === justAddedItemId;
                        return (
                          <div
                            key={item.id}
                            id={`combo-item-${item.id}`}
                            className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border space-y-2.5 shadow-xs transition-all ${
                              isJustAdded
                                ? "border-indigo-500 ring-2 ring-indigo-500/40 shadow-md shadow-indigo-500/10 scale-[1.01]"
                                : "border-slate-200 dark:border-slate-700/80 hover:border-indigo-500/40"
                            }`}
                          >
                            {/* Hàng 1: Thumbnail Ảnh (Trái) + [Header Món & Input Tên Món] (Phải) */}
                            <div className="flex items-center gap-2.5">
                              {/* Khung tải ảnh riêng của món */}
                              <div className="shrink-0 relative group">
                                <label
                                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 ${
                                    item.imageUrl
                                      ? "border-indigo-500/50 shadow-xs"
                                      : "border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/80"
                                  } flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all`}
                                  title="Bấm để tải ảnh riêng cho món này"
                                >
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                      handleItemFileUpload(idx, e)
                                    }
                                    className="hidden"
                                  />
                                  {uploadingItemIdx === idx ? (
                                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                  ) : item.imageUrl ? (
                                    <>
                                      <img
                                        src={getFullImageUrl(item.imageUrl)}
                                        alt={item.name || "Ảnh món"}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Camera className="w-3.5 h-3.5" />
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-center p-0.5">
                                      <Camera className="w-4 h-4 mx-auto text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                      <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                                        + Ảnh
                                      </span>
                                    </div>
                                  )}
                                </label>

                                {/* Nút Xem / Xóa Ảnh nhanh */}
                                {item.imageUrl && (
                                  <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 bg-slate-900/90 backdrop-blur-xs rounded-full p-0.5 shadow-md border border-slate-700">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewFullImage(
                                          item.imageUrl || null,
                                        )
                                      }
                                      className="p-1 rounded-full text-slate-300 hover:text-indigo-400 transition-colors cursor-pointer"
                                      title="Xem ảnh lớn"
                                    >
                                      <Eye className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateComboItem(
                                          idx,
                                          "imageUrl",
                                          "",
                                        )
                                      }
                                      className="p-1 rounded-full text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
                                      title="Xóa ảnh món này"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Bên phải ảnh: Header Món + Nút Xóa + Input Tên Món */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px]">
                                      {idx + 1}
                                    </span>
                                    Món #{idx + 1}
                                  </span>
                                  {comboItems.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveComboItem(idx)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                                      title="Xóa món này"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                <input
                                  type="text"
                                  data-item-name="true"
                                  value={item.name}
                                  onChange={(e) =>
                                    handleUpdateComboItem(
                                      idx,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Tên món (vd: Áo khoác dạ)"
                                  required
                                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500/40 outline-none"
                                />
                              </div>
                            </div>

                            {/* Hàng 2: Size (4/12) + Màu (4/12) + SL (4/12) */}
                            <div className="grid grid-cols-12 gap-1.5 items-center">
                              <div className="col-span-4">
                                <input
                                  type="text"
                                  value={item.size}
                                  onChange={(e) =>
                                    handleUpdateComboItem(
                                      idx,
                                      "size",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Size"
                                  className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500/40 outline-none"
                                />
                              </div>
                              <div className="col-span-4">
                                <input
                                  type="text"
                                  value={item.color}
                                  onChange={(e) =>
                                    handleUpdateComboItem(
                                      idx,
                                      "color",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Màu sắc"
                                  className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500/40 outline-none"
                                />
                              </div>
                              <div className="col-span-4 flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                                  SL:
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={item.quantityStr}
                                  onChange={(e) =>
                                    handleUpdateComboItem(
                                      idx,
                                      "quantityStr",
                                      e.target.value.replace(/\D/g, ""),
                                    )
                                  }
                                  onBlur={() => {
                                    if (
                                      !item.quantityStr ||
                                      parseInt(item.quantityStr) < 1
                                    ) {
                                      handleUpdateComboItem(
                                        idx,
                                        "quantityStr",
                                        "1",
                                      );
                                    }
                                  }}
                                  placeholder="1"
                                  className="w-full text-center bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none"
                                />
                              </div>
                            </div>

                            {/* Hàng 3: 4 trường tài chính độc lập cho món này (Giá gốc, Giá bán, Tiền ship, Đã cọc) */}
                            <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 space-y-1.5">
                              <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block">
                                💰 Chi phí & Giá món #{idx + 1}
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                {/* Giá gốc / Vốn */}
                                <div>
                                  <label className="block text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase mb-0.5">
                                    Giá gốc / Vốn
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={14}
                                    value={item.costPriceStr}
                                    onChange={(e) =>
                                      handleUpdateComboItem(
                                        idx,
                                        "costPriceStr",
                                        e.target.value
                                          .replace(/\D/g, "")
                                          .slice(0, 14),
                                      )
                                    }
                                    placeholder="0"
                                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-amber-500 font-bold text-xs text-right outline-none focus:ring-1 focus:ring-amber-500"
                                  />
                                </div>

                                {/* Giá bán */}
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase mb-0.5">
                                    Giá bán{" "}
                                    <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={14}
                                    value={item.amountStr}
                                    onChange={(e) =>
                                      handleUpdateComboItem(
                                        idx,
                                        "amountStr",
                                        e.target.value
                                          .replace(/\D/g, "")
                                          .slice(0, 14),
                                      )
                                    }
                                    placeholder="0"
                                    required
                                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs text-right outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>

                                {/* Tiền ship */}
                                <div>
                                  <label className="block text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase mb-0.5">
                                    Tiền ship
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={14}
                                    value={item.shippingFeeStr}
                                    onChange={(e) =>
                                      handleUpdateComboItem(
                                        idx,
                                        "shippingFeeStr",
                                        e.target.value
                                          .replace(/\D/g, "")
                                          .slice(0, 14),
                                      )
                                    }
                                    placeholder="0"
                                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-500 font-bold text-xs text-right outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>

                                {/* Khách đã trả / cọc */}
                                <div>
                                  <div className="flex items-center justify-between mb-0.5">
                                    <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                                      Đã trả / cọc
                                    </label>
                                    {parseFormattedNumber(item.amountStr) >
                                      0 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateComboItem(
                                            idx,
                                            "paidAmountStr",
                                            item.amountStr,
                                          )
                                        }
                                        className="text-[9px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                                      >
                                        Đủ
                                      </button>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={14}
                                    value={item.paidAmountStr}
                                    onChange={(e) =>
                                      handleUpdateComboItem(
                                        idx,
                                        "paidAmountStr",
                                        e.target.value
                                          .replace(/\D/g, "")
                                          .slice(0, 14),
                                      )
                                    }
                                    placeholder="0"
                                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-500 font-bold text-xs text-right outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Hàng 4: Ghi chú thêm */}
                            <div>
                              <input
                                type="text"
                                value={item.note}
                                onChange={(e) =>
                                  handleUpdateComboItem(
                                    idx,
                                    "note",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ghi chú món: màu sắc, loại vải, lưu ý..."
                                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-[11px] outline-none"
                              />
                            </div>
                          </div>
                        );
                      })}

                      {/* Nút Thêm Món Lớn Ở Dưới Cùng Danh Sách */}
                      <button
                        type="button"
                        onClick={handleAddComboItem}
                        className="w-full py-2.5 px-3 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 hover:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm Món Mới (Món #{comboItems.length + 1})</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ========================================================= */}
              {/* TRƯỜNG HỢP 3: 1 SẢN PHẨM - NHIỀU KHÁCH (GOM ORDER MUA CHUNG) */}
              {/* ========================================================= */}
              {orderMode === "GROUP_ORDER" && (
                <>
                  {/* Thông tin sản phẩm lô chung */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Tên sản phẩm
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Ví dụ: Giày Sneaker MLB Chunky NY, Áo phao Zara đợt 1..."
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500/40 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Mã đơn hàng
                        </label>
                        <input
                          type="text"
                          value={orderCode}
                          onChange={(e) => setOrderCode(e.target.value)}
                          placeholder="Tự động tạo (DH-0001)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
                        />
                      </div>
                    </div>

                    {/* Hàng 2: Giá gốc (giá nhập) & Giá bán ra */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Giá gốc (Giá nhập / món)
                          </label>
                          {parseFormattedNumber(groupCostPriceStr) > 0 && (
                            <span className="text-[10px] font-extrabold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                              {formatVND(
                                parseFormattedNumber(groupCostPriceStr),
                              )}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={14}
                          value={groupCostPriceStr}
                          onChange={(e) =>
                            setGroupCostPriceStr(
                              e.target.value.replace(/\D/g, "").slice(0, 14),
                            )
                          }
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-amber-500 font-bold text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Giá bán ra (cho mỗi khách)
                          </label>
                          {parseFormattedNumber(groupSellingPriceStr) > 0 && (
                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                              {formatVND(
                                parseFormattedNumber(groupSellingPriceStr),
                              )}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={14}
                          value={groupSellingPriceStr}
                          onChange={(e) =>
                            setGroupSellingPriceStr(
                              e.target.value.replace(/\D/g, "").slice(0, 14),
                            )
                          }
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Danh sách khách hàng mua chung */}
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Khách Hàng
                      </label>
                      <button
                        type="button"
                        onClick={handleOpenAddGroupCustomer}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-500/20 transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Thêm khách</span>
                      </button>
                    </div>

                    {groupCustomers.length === 0 ? (
                      <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                        <Users className="w-8 h-8 mx-auto text-slate-400" />
                        <p className="text-xs text-slate-500">
                          Chưa có khách nào đăng ký mua đợt này
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenAddGroupCustomer}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                        >
                          Thêm Khách Đầu Tiên
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {groupCustomers.map((c, idx) => {
                          const cAmount = Number(c.amount) || 0;
                          const cPaid = Number(c.paidAmount) || 0;
                          const cShip = Number(c.shippingFee) || 0;
                          const cItemTotal = Math.max(0, cAmount - cShip);
                          const cRemaining = Math.max(0, cAmount - cPaid);

                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="font-bold text-slate-900 dark:text-white truncate">
                                      {c.name}
                                    </p>
                                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] border border-indigo-500/20">
                                      SL: {c.quantity || 1}
                                    </span>
                                    {(c.size || size) && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[10px] border border-purple-500/20">
                                        Size: {c.size || size}
                                      </span>
                                    )}
                                    {(c.color || color) && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20">
                                        Màu: {c.color || color}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                                    {c.phone && <span>📞 {c.phone}</span>}
                                    {c.address && (
                                      <span className="text-slate-500 dark:text-slate-400">
                                        📍 {c.address}
                                      </span>
                                    )}
                                    {c.note && <span>• {c.note}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  {cShip > 0 && (
                                    <span className="text-[10px] text-slate-400 block">
                                      Hàng: {formatVND(cItemTotal)} + Ship:{" "}
                                      {formatVND(cShip)}
                                    </span>
                                  )}
                                  <span className="font-bold text-slate-900 dark:text-white block">
                                    Cần thu: {formatVND(cAmount)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    Đã thu:{" "}
                                    <strong className="text-emerald-500">
                                      {formatVND(cPaid)}
                                    </strong>
                                    {cRemaining > 0 ? (
                                      <span className="text-amber-500 ml-1 font-semibold">
                                        | Nợ: {formatVND(cRemaining)}
                                      </span>
                                    ) : cAmount > 0 ? (
                                      <span className="text-emerald-500 ml-1 font-semibold">
                                        | Đủ
                                      </span>
                                    ) : null}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOpenEditGroupCustomer(idx)
                                    }
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveGroupCustomer(idx)
                                    }
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* HÌNH ẢNH SẢN PHẨM LÔ / HÓA ĐƠN CHUNG (Chỉ hiển thị cho SINGLE_ITEM & GROUP_ORDER) */}
              {orderMode !== "CUSTOMER_ITEMS" && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      <ImageIcon className="w-4 h-4 text-emerald-500" />
                      <span>Hình ảnh</span>
                    </label>
                    <div className="flex items-center gap-1 text-[11px] bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setImageInputMode("upload")}
                        className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          imageInputMode === "upload"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        }`}
                      >
                        Tải ảnh
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode("url")}
                        className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          imageInputMode === "url"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        }`}
                      >
                        Dán URL
                      </button>
                    </div>
                  </div>

                  {imageInputMode === "upload" ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {!imageUrl ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/80 rounded-2xl p-4 text-center cursor-pointer transition-all bg-white/50 dark:bg-slate-900/50 hover:bg-emerald-50/20 space-y-1 group"
                        >
                          <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            {isCompressingImage ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <UploadCloud className="w-5 h-5" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {isCompressingImage
                              ? "Đang nén ảnh sắc nét..."
                              : "Bấm để chọn ảnh sản phẩm"}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                          <img
                            src={getFullImageUrl(imageUrl)}
                            alt="Preview"
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 cursor-pointer"
                            onClick={() => setPreviewFullImage(imageUrl)}
                          />
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-xs text-emerald-500 font-bold">
                              ✓ Đã tải ảnh lên
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewFullImage(imageUrl)}
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                              >
                                Xem lớn
                              </button>
                              <button
                                type="button"
                                onClick={() => setImageUrl("")}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* BẢNG TỔNG KẾT TÀI CHÍNH & LỢI NHUẬN DỰ KIẾN */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Tổng Doanh Thu
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {formatVND(calculatedTotalAmount)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Tiền Vốn
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm text-amber-500">
                      {formatVND(calculatedCostPrice)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Phí Ship
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm text-blue-500">
                      {formatVND(calculatedShippingFee)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Lợi Nhuận Dự Kiến
                    </span>
                    <span
                      className={`font-extrabold text-xs sm:text-sm ${
                        estimatedProfit >= 0
                          ? "text-emerald-500"
                          : "text-rose-500"
                      }`}
                    >
                      {formatVND(estimatedProfit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs hover:opacity-95 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading
                    ? "Đang lưu..."
                    : isEditing
                      ? "Lưu Thay Đổi"
                      : orderMode === "SINGLE_ITEM"
                        ? "Tạo Đơn Hàng 1 Món"
                        : orderMode === "CUSTOMER_ITEMS"
                          ? "Tạo Đơn Hàng"
                          : "Tạo Đơn Hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL THÊM / SỬA KHÁCH TRONG GROUP_ORDER */}
      {isCustomerModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsCustomerModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4 bg-slate-50/50 dark:bg-slate-900/50">
              <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                <span>
                  {editingCustomerIndex !== null
                    ? `Chỉnh Sửa Khách Hàng #${editingCustomerIndex + 1}`
                    : "Thêm Khách Hàng"}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              id="group-cust-form"
              onSubmit={handleSaveGroupCustomer}
              className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto max-h-[75vh]"
            >
              {custError && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-semibold">
                  {custError}
                </div>
              )}

              {/* ======================================================== */}
              {/* NHÓM 1: THÔNG TIN KHÁCH HÀNG & GIAO HÀNG */}
              {/* ======================================================== */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/50">
                  <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>1. Thông Tin Khách Hàng</span>
                  </span>
                  {availableCustomers.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-semibold">
                      💡 {availableCustomers.length} khách quen
                    </span>
                  )}
                </div>

                {availableCustomers.length > 0 && (
                  <select
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const found = availableCustomers.find(
                        (c) => c._id === selectedId,
                      );
                      if (found) {
                        setCustForm((prev) => ({
                          ...prev,
                          name: found.name,
                          phone: found.phone || prev.phone || "",
                          facebookUrl:
                            found.facebookUrl || prev.facebookUrl || "",
                          address: found.address || prev.address || "",
                        }));
                      }
                    }}
                    defaultValue=""
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/30 text-slate-800 dark:text-slate-100 font-medium outline-none text-xs"
                  >
                    <option value="">
                      -- 💡 Chọn nhanh từ danh bạ khách quen --
                    </option>
                    {availableCustomers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 text-[11px]">
                      Tên khách hàng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={custForm.name}
                      onChange={(e) =>
                        setCustForm({ ...custForm, name: e.target.value })
                      }
                      placeholder="Nguyễn Văn A"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none text-xs focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 text-[11px]">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={custForm.phone || ""}
                      onChange={(e) =>
                        setCustForm({ ...custForm, phone: e.target.value })
                      }
                      placeholder="0912 345 678"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none text-xs focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 text-[11px]">
                      Địa chỉ nhận hàng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={custForm.address || ""}
                      onChange={(e) =>
                        setCustForm({ ...custForm, address: e.target.value })
                      }
                      placeholder="Số nhà, đường, quận/huyện... (bắt buộc)"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none text-xs focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 text-[11px]">
                      Link Facebook / Liên hệ
                    </label>
                    <input
                      type="url"
                      value={custForm.facebookUrl || ""}
                      onChange={(e) =>
                        setCustForm({
                          ...custForm,
                          facebookUrl: e.target.value,
                        })
                      }
                      placeholder="https://facebook.com/username"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none text-xs focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* NHÓM 2: PHÂN LOẠI & SẢN PHẨM KHÁCH ĐẶT */}
              {/* ======================================================== */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/50">
                  <span className="font-bold text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5" />
                    <span>2. Phân Loại & Ghi Chú</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Size */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 text-[11px]">
                      Kích cỡ / Size
                    </label>
                    <div className="flex items-center gap-1 flex-wrap mb-1.5">
                      {["S", "M", "L", "XL", "2XL", "Free"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setCustForm({
                              ...custForm,
                              size: custForm.size === s ? "" : s,
                            })
                          }
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            custForm.size === s
                              ? "bg-purple-500 text-white shadow-sm ring-2 ring-purple-500/30"
                              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={custForm.size || ""}
                      onChange={(e) =>
                        setCustForm({ ...custForm, size: e.target.value })
                      }
                      placeholder="VD: 39, 40, XL..."
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none text-xs"
                    />
                  </div>

                  {/* Màu sắc */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 text-[11px]">
                      Màu sắc / Phân loại
                    </label>
                    <div className="flex items-center gap-1 flex-wrap mb-1.5">
                      {["Đen", "Trắng", "Be", "Xám", "Xanh", "Hồng", "Nâu"].map(
                        (c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() =>
                              setCustForm({
                                ...custForm,
                                color: custForm.color === c ? "" : c,
                              })
                            }
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              custForm.color === c
                                ? "bg-purple-500 text-white shadow-sm ring-2 ring-purple-500/30"
                                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {c}
                          </button>
                        ),
                      )}
                    </div>
                    <input
                      type="text"
                      value={custForm.color || ""}
                      onChange={(e) =>
                        setCustForm({ ...custForm, color: e.target.value })
                      }
                      placeholder="VD: Đen nhám, Trắng kem..."
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 text-[11px]">
                    Ghi chú cho khách này
                  </label>
                  <input
                    type="text"
                    value={custForm.note || ""}
                    onChange={(e) =>
                      setCustForm({ ...custForm, note: e.target.value })
                    }
                    placeholder="Ghi chú thêm: ship giờ hành chính, hẹn nhận hàng..."
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none text-xs"
                  />
                </div>
              </div>

              {/* ======================================================== */}
              {/* NHÓM 3: GIÁ BÁN, PHÍ SHIP & THANH TOÁN */}
              {/* ======================================================== */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 dark:border-emerald-500/20 space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-500/20">
                  <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>3. Giá Bán, Phí Ship & Thanh Toán</span>
                  </span>
                </div>

                {/* Hàng 1: Số lượng (SL) & Tiền ship (cho khách) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 text-[11px]">
                      Số lượng (SL)
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          const current = Math.max(
                            1,
                            parseInt(custQuantityStr) || 1,
                          );
                          if (current > 1) {
                            const newQty = String(current - 1);
                            setCustQuantityStr(newQty);
                            autoCalculateGroupCustAmount(
                              custUnitPriceStr,
                              newQty,
                              custShippingFeeStr,
                            );
                          }
                        }}
                        className="w-8 h-9 rounded-l-xl bg-slate-200/80 dark:bg-slate-700 border border-r-0 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center transition-colors cursor-pointer text-xs"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={custQuantityStr}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setCustQuantityStr(val);
                          autoCalculateGroupCustAmount(
                            custUnitPriceStr,
                            val,
                            custShippingFeeStr,
                          );
                        }}
                        onBlur={() => {
                          if (
                            !custQuantityStr ||
                            parseInt(custQuantityStr) < 1
                          ) {
                            setCustQuantityStr("1");
                            autoCalculateGroupCustAmount(
                              custUnitPriceStr,
                              "1",
                              custShippingFeeStr,
                            );
                          }
                        }}
                        placeholder="1"
                        className="w-full h-9 text-center bg-white dark:bg-slate-900 border-y border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-white outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const current = Math.max(
                            1,
                            parseInt(custQuantityStr) || 1,
                          );
                          const newQty = String(current + 1);
                          setCustQuantityStr(newQty);
                          autoCalculateGroupCustAmount(
                            custUnitPriceStr,
                            newQty,
                            custShippingFeeStr,
                          );
                        }}
                        className="w-8 h-9 rounded-r-xl bg-slate-200/80 dark:bg-slate-700 border border-l-0 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center transition-colors cursor-pointer text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                        Tiền ship (cho khách)
                      </label>
                      {parseFormattedNumber(custShippingFeeStr) > 0 && (
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                          {formatVND(parseFormattedNumber(custShippingFeeStr))}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      value={custShippingFeeStr}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 14);
                        setCustShippingFeeStr(val);
                        autoCalculateGroupCustAmount(
                          custUnitPriceStr,
                          custQuantityStr,
                          val,
                        );
                      }}
                      placeholder="0 (Freeship)"
                      className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold outline-none text-blue-500 text-xs"
                    />
                  </div>
                </div>

                {/* Hàng 2: Giá gốc (nhập/món) & Giá bán ra (1 món) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                        Giá gốc (nhập/món)
                      </label>
                      {parseFormattedNumber(custCostPriceStr) > 0 && (
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded">
                          {formatVND(parseFormattedNumber(custCostPriceStr))}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      value={custCostPriceStr}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 14);
                        setCustCostPriceStr(val);
                      }}
                      placeholder="0"
                      className="w-full h-9 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold outline-none text-amber-500 text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                        Giá bán ra (1 món)
                      </label>
                      {parseFormattedNumber(custUnitPriceStr) > 0 && (
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-1 py-0.5 rounded">
                          {formatVND(parseFormattedNumber(custUnitPriceStr))}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      value={custUnitPriceStr}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 14);
                        setCustUnitPriceStr(val);
                        autoCalculateGroupCustAmount(
                          val,
                          custQuantityStr,
                          custShippingFeeStr,
                        );
                      }}
                      placeholder="0"
                      className="w-full h-9 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold outline-none text-indigo-600 dark:text-indigo-400 text-xs"
                    />
                  </div>
                </div>

                {/* Hàng 3: Tiền khách cọc / trả trước */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                        Tiền khách cọc / trả trước
                      </label>
                      {parseFormattedNumber(custPaidAmountStr) > 0 && (
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded-md">
                          {formatVND(parseFormattedNumber(custPaidAmountStr))}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      value={custPaidAmountStr}
                      onChange={(e) =>
                        setCustPaidAmountStr(
                          e.target.value.replace(/\D/g, "").slice(0, 14),
                        )
                      }
                      placeholder="0"
                      className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold outline-none text-teal-600 dark:text-teal-400 text-xs"
                    />
                  </div>
                </div>

                {/* Hàng 4: DƯỚI CÙNG - CÙNG HÀNG 2 CỘT: TIỀN CẦN THU (TỰ TÍNH, K CHO SỬA) & CÒN LẠI CẦN THU (NỢ) */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-emerald-500/20 items-stretch">
                  {/* Cột trái: Tiền cần thu (Tự động tính = Giá bán * SL + Ship, không cho phép sửa) */}
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-extrabold block">
                        ⚡ Tiền cần thu
                      </span>
                    </div>
                    <div className="font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400 truncate">
                      {formatVND(
                        parseFormattedNumber(custUnitPriceStr) *
                          Math.max(1, parseInt(custQuantityStr) || 1) +
                          parseFormattedNumber(custShippingFeeStr),
                      )}
                    </div>
                  </div>

                  {/* Cột phải: Còn lại cần thu (Nợ) */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Còn lại (Nợ)
                      </span>
                      {parseFormattedNumber(custPaidAmountStr) >=
                        parseFormattedNumber(custUnitPriceStr) *
                          Math.max(1, parseInt(custQuantityStr) || 1) +
                          parseFormattedNumber(custShippingFeeStr) &&
                      parseFormattedNumber(custUnitPriceStr) *
                        Math.max(1, parseInt(custQuantityStr) || 1) +
                        parseFormattedNumber(custShippingFeeStr) >
                        0 ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold text-[9px] border border-emerald-500/20">
                          ✓ Đủ
                        </span>
                      ) : parseFormattedNumber(custPaidAmountStr) > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-bold text-[9px] border border-amber-500/20">
                          Đã cọc
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-[9px]">
                          Chưa thu
                        </span>
                      )}
                    </div>
                    <div className="font-black text-sm sm:text-base text-amber-500 truncate">
                      {formatVND(
                        Math.max(
                          0,
                          parseFormattedNumber(custUnitPriceStr) *
                            Math.max(1, parseInt(custQuantityStr) || 1) +
                            parseFormattedNumber(custShippingFeeStr) -
                            parseFormattedNumber(custPaidAmountStr),
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="group-cust-form"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:opacity-95 shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all"
              >
                {editingCustomerIndex !== null
                  ? "Cập Nhật Khách"
                  : "Thêm Vào Đợt Gom"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM ẢNH PHÓNG TO */}
      {previewFullImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewFullImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl p-3 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewFullImage(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shadow-lg backdrop-blur-sm border border-slate-700"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={getFullImageUrl(previewFullImage)}
              alt="Ảnh phóng to"
              className="max-h-[82vh] w-auto max-w-full object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
