import { useEffect, useState } from 'react';
import { getAllOrders, updateOrderStatus, getAllDetailsofRazorpay } from '../api';
import { useNavigate } from 'react-router-dom';
import '../style/OrderTable.css';
import '../../src/style/All.css';

function AdminOrderPage() {
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();
    const [razorpayInfoMap, setRazorpayInfoMap] = useState({});

    const role = localStorage.getItem("role");

    useEffect(() => {
        if (role !== "ROLE_ADMIN") {
            navigate("/"); // redirect non-admin users
            return;
        }

        getAllOrders()
            .then(res => {
                const sorted = res.data.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
                setOrders(sorted);

                // Fetch Razorpay info for UPI orders
                sorted.forEach(order => {
                    if (order.orderMode === "UPI") {
                        getAllDetailsofRazorpay(order.id)
                            .then(infoRes => {
                                setRazorpayInfoMap(prev => ({ ...prev, [order.id]: infoRes.data }));
                            })
                            .catch(err => console.error(`Failed to fetch Razorpay info for order ${order.id}:`, err));
                    }
                });
            })
            .catch(err => console.error("Failed to load orders:", err));
    }, [navigate, role]);

    const handleStatusChange = (orderId, newStatus) => {
        updateOrderStatus(orderId, newStatus)
            .then(res => {
                setOrders(prevOrders =>
                    prevOrders.map(order =>
                        order.id === orderId ? res.data : order
                    )
                );
            })
            .catch(err => console.error("Failed to update order status:", err));
    };

    const groupOrdersByTime = (orders) => {
        return orders.reduce((groups, order) => {
            const timeKey = new Date(order.createdAt).toLocaleString();
            if (!groups[timeKey]) groups[timeKey] = [];
            groups[timeKey].push(order);
            return groups;
        }, {});
    };

    const groupedOrders = groupOrdersByTime(orders);

    // Allowed status transitions
    const statusOptions = ["Placed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

    const getAvailableStatuses = (currentStatus) => {
        if (currentStatus === "Cancelled") {
            return ["Cancelled"];
        }
        if (currentStatus === "Delivered") {
            return ["Delivered"];
        }

        const currentIndex = statusOptions.indexOf(currentStatus);
        if (currentIndex === -1) return [];

        return [...statusOptions.slice(currentIndex, -1), "Cancelled"];
    };

    return (
        <div className="container mt-4 mb-0">
            <h2 className="mb-4 text-primary fw-bold">All Orders</h2>

            {orders.length === 0 ? (
                <p className="text-muted text-center">No orders found.</p>
            ) : (
                <div style={{  maxHeight: '100vh', overflowY: 'auto', maxWidth:'90vw', overflowX:"hidden" }}>
                    {Object.entries(groupedOrders).map(([time, batch], batchIndex) => {
                        const { id, userName, orderMode, orderStatus, address, phoneNumber, deliveryDate } = batch[0];

                        return (
                            <div key={time} className="mb-4 p-3 shadow-sm rounded bg-light">
                                <h5 className="text-primary">
                                    Order Batch {batchIndex + 1} (Placed at: {time})
                                </h5>

                                <div className="mb-2 d-flex flex-wrap gap-1 align-items-center">
                                    <strong>User:</strong> {userName} |{" "}
                                    <strong>Address:</strong> {address} |{" "}
                                    <strong>Phone:</strong> {phoneNumber} |{" "}
                                    <strong>Delivery Date:</strong> {new Date(deliveryDate).toLocaleDateString()}
                                </div>

                                <div className="mb-2">
                                    <strong>Order Mode:</strong> {orderMode} |{" "}
                                    <strong>Status:</strong>
                                    <select
                                        className="form-select d-inline-block w-auto ms-2"
                                        value={orderStatus}
                                        onChange={(e) => handleStatusChange(id, e.target.value)}
                                    >
                                        {getAvailableStatuses(orderStatus).map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                    |{" "}
                                    <strong>Total:</strong> {batch.reduce((sum, o) => sum + o.total, 0).toFixed(2)} |{" "}
                                    <strong>Updated at:</strong> {new Date(batch[0].updatedAt).toLocaleString()}
                                </div>

                                <div className="my-table-wrapper table-responsive shadow-sm rounded">
                                    <table className="table table-striped table-hover text-center mb-0 align-middle">
                                        <thead className="table-light ">
                                            <tr>
                                                <th>Sr No</th>
                                                <th>Name</th>
                                                <th>Author</th>
                                                <th>Quantity</th>
                                                <th>Unit Price</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {batch.flatMap((order) => {
                                                const rows = order.items.map((item, itemIndex) => (
                                                    <tr key={`${item.id}`}>
                                                        <td>{itemIndex + 1}</td>
                                                        <td>{item.bookName}</td>
                                                        <td>{item.authorName}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{item.unitPrice.toFixed(2)}</td>
                                                        <td>{item.subtotal.toFixed(2)}</td>
                                                    </tr>
                                                ));

                                                // Add Razorpay info row for UPI orders
                                                if (order.orderMode === "UPI" && razorpayInfoMap[order.id]) {
                                                    rows.push(
                                                        <tr key={`razorpay-${order.id}`}>
                                                            <td colSpan={6} style={{ backgroundColor: "#f8f9fa", padding: "2px" }}>
                                                                <strong>Razorpay Details:</strong>
                                                                <table className="table table-sm table-bordered mt-2 mb-0" style={{ fontSize: "0.85rem" }}>
                                                                    <tbody>
                                                                        <tr>
                                                                            <td><strong>Order ID</strong></td>
                                                                            <td>{razorpayInfoMap[order.id].razorpayOrderId}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td><strong>Payment ID</strong></td>
                                                                            <td>{razorpayInfoMap[order.id].razorpayPaymentId}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td><strong>Signature</strong></td>
                                                                            <td>{razorpayInfoMap[order.id].razorpaySignature}</td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return rows;
                                            })}
                                        </tbody>

                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default AdminOrderPage;
