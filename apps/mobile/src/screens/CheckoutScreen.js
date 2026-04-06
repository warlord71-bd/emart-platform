import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../theme/colors";
import { useCart } from "../context/CartContext";
import { useOrders } from "../context/OrderContext";
import { createOrder, validateCoupon } from "../services/woocommerce";
import { useLanguage } from "../context/LanguageContext";

const MERCHANT_NUMBER = "01919797399";

const CheckoutScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { items, cartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("cod");
  const [trxId, setTrxId] = useState("");
  const [placing, setPlacing] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const deliveryFee = cartTotal >= 2000 ? 0 : 80;
  const total = Math.max(0, cartTotal - couponDiscount + deliveryFee);

  const paymentMethods = [
    { key: "cod", label: "Cash on Delivery", icon: "cash-outline", title: "Cash on Delivery" },
    { key: "bkash", label: "bKash", icon: "phone-portrait-outline", title: "bKash" },
    { key: "nagad", label: "Nagad", icon: "phone-portrait-outline", title: "Nagad" },
  ];

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const res = await validateCoupon(couponCode.trim());
    if (res.data && res.data.length > 0) {
      const coupon = res.data[0];
      if (coupon.date_expires && new Date(coupon.date_expires) < new Date()) {
        Alert.alert("Expired", "This coupon has expired");
        setCouponLoading(false);
        return;
      }
      if (coupon.minimum_amount && parseFloat(coupon.minimum_amount) > cartTotal) {
        Alert.alert("Minimum Not Met", `Minimum order ৳${Math.round(parseFloat(coupon.minimum_amount))} required`);
        setCouponLoading(false);
        return;
      }
      let discount = 0;
      if (coupon.discount_type === "percent") {
        discount = (cartTotal * parseFloat(coupon.amount)) / 100;
        if (coupon.maximum_amount && discount > parseFloat(coupon.maximum_amount)) {
          discount = parseFloat(coupon.maximum_amount);
        }
      } else {
        discount = parseFloat(coupon.amount) || 0;
      }
      setCouponDiscount(Math.round(discount));
      setCouponApplied(coupon);
      Alert.alert("Coupon Applied!", `You saved ৳${Math.round(discount)}`);
    } else {
      Alert.alert("Invalid Coupon", "This coupon code is not valid");
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => { setCouponCode(""); setCouponDiscount(0); setCouponApplied(null); };

  const placeOrder = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) { Alert.alert("Missing Info", "Please fill all fields"); return; }
    if ((payment === "bkash" || payment === "nagad") && !trxId.trim()) { Alert.alert("Transaction ID Required", `Please enter your ${payment === "bkash" ? "bKash" : "Nagad"} transaction ID`); return; }
    if (items.length === 0) { Alert.alert("Cart Empty", "Please add items before placing order"); return; }

    setPlacing(true);
    try {
      const selectedMethod = paymentMethods.find((m) => m.key === payment);
      const orderData = {
        payment_method: payment,
        payment_method_title: selectedMethod.title,
        set_paid: payment !== "cod",
        billing: { first_name: name, phone, address_1: address, country: "BD" },
        shipping: { first_name: name, address_1: address, country: "BD" },
        customer_note: payment === "cod" ? "Cash on Delivery" : `${selectedMethod.title} Transaction ID: ${trxId}`,
        line_items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        coupon_lines: couponApplied ? [{ code: couponApplied.code }] : [],
      };
      const res = await createOrder(orderData);
      if (res.error) throw new Error(res.error);
      addOrder({ customerName: name, phone, address, paymentMethod: payment, items, itemsCount: items.reduce((sum, item) => sum + item.quantity, 0), total: `৳${Math.round(total)}`, products: items.map((item) => item.name).join(", "), image: items[0]?.image || null, coupon: couponApplied?.code || null });
      clearCart();
      navigation.navigate("OrderSuccess", { orderId: res.data?.id });
    } catch (error) {
      Alert.alert("Order Error", "Failed to place order. Please try again.");
    } finally { setPlacing(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Checkout</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-outline" size={16} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>Customer Information</Text>
          </View>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={16} color={COLORS.textLight} />
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={COLORS.textLight} value={name} onChangeText={setName} />
          </View>
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={16} color={COLORS.textLight} />
            <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor={COLORS.textLight} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          </View>
          <View style={[styles.inputWrap, { height: 80, alignItems: "flex-start", paddingTop: 12 }]}>
            <Ionicons name="location-outline" size={16} color={COLORS.textLight} style={{ marginTop: 2 }} />
            <TextInput style={[styles.input, { height: 60 }]} placeholder="Delivery Address" placeholderTextColor={COLORS.textLight} value={address} onChangeText={setAddress} multiline />
          </View>
        </View>

        {/* Coupon */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="pricetag-outline" size={16} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>Coupon Code</Text>
          </View>
          {couponApplied ? (
            <View style={styles.couponApplied}>
              <View style={styles.couponAppliedLeft}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <View>
                  <Text style={styles.couponAppliedCode}>{couponApplied.code.toUpperCase()}</Text>
                  <Text style={styles.couponAppliedSave}>You save ৳{couponDiscount}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={removeCoupon}>
                <Ionicons name="close-circle" size={22} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponRow}>
              <View style={[styles.inputWrap, { flex: 1, marginBottom: 0 }]}>
                <Ionicons name="pricetag-outline" size={16} color={COLORS.textLight} />
                <TextInput style={styles.input} placeholder="Enter coupon code" placeholderTextColor={COLORS.textLight} value={couponCode} onChangeText={setCouponCode} autoCapitalize="characters" />
              </View>
              <TouchableOpacity style={styles.couponApplyBtn} onPress={handleApplyCoupon} disabled={couponLoading}>
                {couponLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.couponApplyText}>Apply</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="card-outline" size={16} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          {paymentMethods.map((method) => (
            <TouchableOpacity key={method.key} style={[styles.payOption, payment === method.key && styles.payOptionActive]} onPress={() => setPayment(method.key)} activeOpacity={0.8}>
              <View style={[styles.radio, payment === method.key && styles.radioActive]}>
                {payment === method.key && <View style={styles.radioDot} />}
              </View>
              <Ionicons name={method.icon} size={18} color={payment === method.key ? COLORS.accent : COLORS.textSecondary} />
              <Text style={[styles.payText, payment === method.key && styles.payTextActive]}>{method.label}</Text>
            </TouchableOpacity>
          ))}
          {(payment === "bkash" || payment === "nagad") && (
            <View style={styles.merchantBox}>
              <View style={styles.merchantRow}>
                <Text style={styles.merchantLabel}>Send to {payment === "bkash" ? "bKash" : "Nagad"} Merchant:</Text>
                <Text style={styles.merchantNumber}>{MERCHANT_NUMBER}</Text>
              </View>
              <View style={styles.inputWrap}>
                <Ionicons name="receipt-outline" size={16} color={COLORS.textLight} />
                <TextInput style={styles.input} placeholder="Enter Transaction ID" placeholderTextColor={COLORS.textLight} value={trxId} onChangeText={setTrxId} />
              </View>
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="receipt-outline" size={16} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Items ({items.reduce((sum, item) => sum + item.quantity, 0)})</Text><Text style={styles.summaryValue}>৳{Math.round(cartTotal)}</Text></View>
          {couponDiscount > 0 && <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: COLORS.success }]}>Coupon Discount</Text><Text style={[styles.summaryValue, { color: COLORS.success }]}>-৳{couponDiscount}</Text></View>}
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery</Text><Text style={[styles.summaryValue, deliveryFee === 0 && { color: COLORS.success }]}>{deliveryFee === 0 ? "Free" : `৳${deliveryFee}`}</Text></View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>৳{Math.round(total)}</Text></View>
        </View>

        <TouchableOpacity activeOpacity={0.85} onPress={placeOrder} disabled={placing}>
          <LinearGradient colors={placing ? [COLORS.textLight, COLORS.textLight] : COLORS.gradientButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
            {placing ? <Text style={styles.buttonText}>Placing Order...</Text> : <><Text style={styles.buttonText}>Place Order</Text><Text style={styles.buttonPrice}>৳{Math.round(total)}</Text></>}
          </LinearGradient>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingTop: 48 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", ...COLORS.shadow },
  title: { fontSize: 20, ...FONTS.bold, color: COLORS.text },
  section: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 12, ...COLORS.shadow },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 14, ...FONTS.bold, color: COLORS.text },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 10, gap: 10, backgroundColor: COLORS.bg },
  input: { flex: 1, fontSize: 13, color: COLORS.text },
  couponRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  couponApplyBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 20, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  couponApplyText: { fontSize: 13, ...FONTS.bold, color: "#fff" },
  couponApplied: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.accentLight, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.tagBg },
  couponAppliedLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  couponAppliedCode: { fontSize: 13, ...FONTS.bold, color: COLORS.success },
  couponAppliedSave: { fontSize: 11, color: COLORS.textSecondary },
  payOption: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, marginBottom: 8, backgroundColor: COLORS.bg },
  payOptionActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: COLORS.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  payText: { fontSize: 13, ...FONTS.semibold, color: COLORS.text },
  payTextActive: { color: COLORS.accent, ...FONTS.bold },
  merchantBox: { marginTop: 8, backgroundColor: COLORS.accentLight, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.tagBg },
  merchantRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  merchantLabel: { fontSize: 11, color: COLORS.textSecondary },
  merchantNumber: { fontSize: 16, ...FONTS.extrabold, color: COLORS.accent },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  summaryValue: { fontSize: 13, ...FONTS.semibold, color: COLORS.text },
  divider: { borderTopWidth: 1, borderStyle: "dashed", borderTopColor: COLORS.border, marginVertical: 8 },
  totalLabel: { fontSize: 15, ...FONTS.bold, color: COLORS.text },
  totalValue: { fontSize: 18, ...FONTS.extrabold, color: COLORS.accent },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 15, borderRadius: 14, gap: 8 },
  buttonText: { color: "#fff", fontSize: 15, ...FONTS.bold },
  buttonPrice: { color: "rgba(255,255,255,0.8)", fontSize: 14, ...FONTS.semibold },
});

export default CheckoutScreen;
