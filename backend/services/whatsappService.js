'use strict';
function buildEnquiryUrl(whatsappNumber, productName, price) {
  if (!whatsappNumber) return null;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi! I'm interested in ${productName} (₹${price}). Is it available?`)}`;
}
function buildOrderConfirmUrl(whatsappNumber, orderId) {
  if (!whatsappNumber) return null;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi! I just placed Order #${orderId}. Please confirm the delivery time.`)}`;
}
function buildGeneralUrl(whatsappNumber, message) {
  if (!whatsappNumber) return null;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message || "Hello! I'd like to place an order.")}`;
}
module.exports = { buildEnquiryUrl, buildOrderConfirmUrl, buildGeneralUrl };
