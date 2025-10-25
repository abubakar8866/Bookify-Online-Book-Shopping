import axios from "axios";

import {jwtDecode} from "jwt-decode";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
});

export function setAuthToken(token, role) {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
    if (role) localStorage.setItem('role', role);

    const decoded = jwtDecode(token);

    // Store email from sub
    if (decoded.sub) {
      localStorage.setItem("email", decoded.sub);
    }

    // Check if userId exists in token
    if (decoded.userId) {
      localStorage.setItem('userId', decoded.userId);
    } else {
      axios.get(`${API.defaults.baseURL}/auth/email/${decoded.sub}`)
        .then(response => {
          const userId = response.data.userId; 
          localStorage.setItem('userId', userId);
        })
        .catch(error => {
          console.error('Failed to fetch userId from email:', error);
        });
    }

  } else {
    // Remove stored data if no token
    delete API.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
  }
}

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function sendMultipart(url, data, method = "post") {
  return API({
    url,
    method,
    data,
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/* -------------------- PROFILE -------------------- */

// Get user profile by ID
export function getProfile(userId) {
  return API.get(`/auth/profile/${userId}`);
}

// Update user profile by ID (multipart)
export function updateProfile(userId, profileDTO, file) {
  const data = buildFormData(profileDTO, file);
  return sendMultipart(`/auth/profile/${userId}`, data, "put");
}

// fetch All Books
export function fetchAllBooks() {
  return API.get('/auth/books');
}

// fetch All Authors
export function fetchAllAuthors() {
  return API.get('/auth/authors');
}

/* -------------------- AUTHORS -------------------- */

// Get authors with pagination
export function getAuthors(page = 0, size = 4) {
  return API.get(`/authors?page=${page}&size=${size}`);
}

// Get single author
export function getAuthor(id) {
  return API.get(`/authors/${id}`);
}

// Create author (multipart for image/file)
export function createAuthor(authorData) {
  return sendMultipart("/authors", authorData, "post");
}

// Update author (multipart)
export function updateAuthor(id, authorData) {
  return sendMultipart(`/authors/${id}`, authorData, "put");
}

// Delete author
export function deleteAuthor(id) {
  return API.delete(`/authors/${id}`);
}

// Get all books (only accessible by admin)
export function getAllBooksByAdmin(page = 0, size = 4) {
  return API.get(`/books?page=${page}&size=${size}`);
}


// Get only author names
export async function getAuthorNames() {
  const res = await API.get("/authors/names");
  return res.data;
}

//Search
export async function searchByName(name,page,size){
  return API.get(`/authors/search`, { params: { name, page, size }});
}

/* -------------------- HELPERS -------------------- */

// Convert DTO + file into FormData
function buildFormData(dto, file) {
  const formData = new FormData();
  formData.append("value", JSON.stringify(dto));
  if (file) {
    formData.append("file", file);
  }
  return formData;
}


/* -------------------- BOOKS -------------------- */

// Get books with pagination
export function getBooks(page, size) {
  return API.get(`/books?page=${page}&size=${size}`);
}

// Get single book
export function getBook(id) {
  return API.get(`/books/${id}`);
}

// Create book
export function createBook(bookDTO, file) {
  const data = buildFormData(bookDTO, file);
  return sendMultipart("/books", data, "post");
}

// Update book
export function updateBook(id, bookDTO, file) {
  const data = buildFormData(bookDTO, file);
  return sendMultipart(`/books/${id}`, data, "put");
}

// Delete book
export function deleteBook(id) {
  return API.delete(`/books/${id}`);
}

//Search
export function searchBooksByName(name,page,size) {
  return API.get(`/books/search`, { params: { name, page, size }});
}

/* -------------------- User BOOKS -------------------- */

// Get paginated books for logged-in user
export function getUserBooks(page = 0, size = 3) {
  return API.get(`/user/books?page=${page}&size=${size}`);
}

//Search
export function searchUserBooksByName(name,page,size) {
  return API.get(`/user/books/search`, { params: { name, page, size }});
}

/* -------------------- WISHLIST -------------------- */

// Add book to wishlist
export function addToWishlist(userId, bookId) {
  return API.post(`/wishlist/${userId}/${bookId}`,{});
}

// Get user wishlist
export function getWishlist(userId) {
  return API.get(`/wishlist/${userId}`);
}

// Remove from wishlist
export function removeFromWishlist(userId, wishlistId) {
  return API.delete(`/wishlist/${userId}/${wishlistId}`);
}

/* -------------------- CART -------------------- */

// Add book to cart
export function addToCart(userId, cartId) {
  return API.post(`/cart/${userId}/${cartId}`,{});
}

// Get user cart
export function getCart(userId) {
  return API.get(`/cart/${userId}`);
}

// Get user name by user ID
export function getUserNameByUserId(userId) {
  return API.get(`/cart/${userId}/name`);
}

// Remove from cart
export function removeFromCart(userId, cartId) {
  return API.delete(`/cart/${userId}/${cartId}`);
}

/* -------------------- ORDER -------------------- */

// Place a new order
export function placeOrder(orderData) {
  return API.post(`/order/place`, orderData);
}

// Get orders by user ID
export function getOrdersByUserId(userId) {
  return API.get(`/order/user/${userId}`);
}

// Edit an order by order ID
export function editOrdersByUserId(orderId, orderData) {
  return API.put(`/order/edit/${orderId}`, orderData);
}

// Remove an order by order ID
export function removeOrder(orderId) {
  return API.delete(`/order/${orderId}`);
}

// Remove a single product (book) from an order
export function removeOrderItem(orderId, bookId) {
  return API.delete(`/order/${orderId}/book/${bookId}`);
}

/* -------------------- PAYMENT (RAZORPAY) -------------------- */

//Feching RazerPayKey
export function fetchRazerpayKey(){
  return API.get("/payment/key");
}


//Create Razorpay Order
export function createRazorpayOrder(data) {
  return API.post(`/payment/create-order`, data);
}

//Verify Razorpay Payment Signature
export function verifyRazorpayPayment(data) {
  return API.post(`/payment/verify`, data);
}

//Place order after Razorpay payment success
export function placeRazorpayOrder(data) {
  return API.post(`/payment/place-order`, data);
}

//fetching Razorpay Info from DB 
export function fetchingRazorpayInfo(orderId){
  return API.get(`/payment/info/${orderId}`);
}

/* -------------------- REVIEWS & RATINGS -------------------- */

// Add review & rating for a specific book in an order
export function addReviewAndRating(orderId, bookId, dto) {
  return API.post(`/order/${orderId}/book/${bookId}/review`, dto);
}

/* -------------------- ADMIN ORDERS -------------------- */

// Get all orders (Admin only)
export function getAllOrders() {
  return API.get(`/admin/orders`);
}

// Update order status (Admin only)
export function updateOrderStatus(orderId, orderStatus) {
  return API.put(`/admin/orders/${orderId}/status`, { orderStatus });
}

// Get all orders (Admin only)
export function getAllDetailsofRazorpay(orderId) {
  return API.get(`/admin/orders/info/${orderId}`);
}

/* -------------------- ADMIN ORDER ANALYTICS -------------------- */

// Get dashboard stats (today, total, recent 5)
export function getAdminOrderStats() {
  return API.get(`/admin/orders/stats`);
}

// Get custom range stats
// dto = { startDate: "2025-09-01T00:00:00", endDate: "2025-09-20T23:59:59" }
export function getAdminOrderStatsByRange(dto) {
  return API.post(`/admin/orders/stats/range`, dto);
}

// Get weekly stats
export function getWeeklyOrderStats() {
  return API.get(`/admin/orders/stats/weekly`);
}

// Get monthly stats
export function getMonthlyOrderStats() {
  return API.get(`/admin/orders/stats/monthly`);
}

/* -------------------- Info Api -------------------- */
// Get all User
export function getAllUser() {
  return API.get(`/info/users`);
}

// Get all Cart Items
export function getAllCartItems() {
  return API.get(`/info/carts`);
}

// Get all WishList Items
export function getAllWishListItems() {
  return API.get(`/info/wishlists`);
}

/* -------------------- RETURN / REPLACEMENT -------------------- */

// Create a new return/replacement request
export function createReturnReplacementRequest(formData) {
  return API.post(`/returns/request`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// Get all return/replacement requests for a specific user
export function getUserReturnRequests(userId) {
  return API.get(`/returns/user/${userId}`);
}

// Get a single return/replacement request by ID
export function getReturnRequestById(requestId) {
  return API.get(`/returns/${requestId}`);
}

// Edit an existing return/replacement request
export function editReturnReplacementRequest(returnId, formData) {
  return API.put(`/returns/${returnId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// Delete a return/replacement request by ID
export function deleteReturnReplacementRequest(returnId) {
  return API.delete(`/returns/${returnId}`);
}

/* -------------------- ADMIN RETURN / REPLACEMENT -------------------- */

// Get all return/replacement requests (Admin)
export function getAllReturnRequests() {
  return API.get(`/admin/returns/all`);
}

// Get return/replacement requests filtered by status (Admin)
export function getReturnRequestsByStatus(status) {
  // status = "PENDING", "APPROVED", "REFUNDED", etc.
  return API.get(`/admin/returns/status/${status}`);
}

// Update status of a return/replacement request (Admin)
// status = "APPROVED", "REJECTED", "REPLACED", etc.
export function updateReturnRequestStatus(requestId, status) {
  return API.put(`/admin/returns/update-status/${requestId}`, null, { params: { status } });
}

// Refund a return request via Razorpay (Admin)
export function refundReturnRequest(requestId) {
  return API.put(`/admin/returns/refund/${requestId}`);
}

export default API;
