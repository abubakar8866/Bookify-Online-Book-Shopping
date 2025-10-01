import { useEffect, useState } from "react";
import { getAllUser, getAllCartItems, getAllWishListItems } from "../api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import '../../src/style/All.css';

const InformationPage = () => {
  const [users, setUsers] = useState([]);
  const [carts, setCarts] = useState([]);
  const [wishlists, setWishlists] = useState([]);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    getAllUser().then((res) => setUsers(res.data)).catch(console.error);
    getAllCartItems().then((res) => setCarts(res.data)).catch(console.error);
    getAllWishListItems().then((res) => setWishlists(res.data)).catch(console.error);
  }, []);

  const renderTable = () => {
    if (activeTab === "users") {
      return (
        <table className="table table-striped table-hover shadow-sm">
          <thead className="table-primary">
            <tr>
              <th><i className="bi bi-person-circle"></i> ID</th>
              <th><i className="bi bi-person"></i> Name</th>
              <th><i className="bi bi-envelope"></i> Email</th>
              <th><i className="bi bi-gender-ambiguous"></i> Gender</th>
              <th><i className="bi bi-bookmark-heart"></i> Favourite Book</th>
              <th><i className="bi bi-pencil"></i> Favourite Author</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.gender}</td>
                <td>{u.favouriteBook || "-"}</td>
                <td>{u.favouriteAuthor || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTab === "carts") {
      return (
        <table className="table table-striped table-hover shadow-sm">
          <thead className="table-success">
            <tr>
              <th><i className="bi bi-cart"></i> Cart ID</th>
              <th><i className="bi bi-person"></i> User Name</th>
              <th><i className="bi bi-book"></i> Book Name</th>
            </tr>
          </thead>
          <tbody>
            {carts.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.user?.name}</td>
                <td>{c.book?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTab === "wishlists") {
      return (
        <table className="table table-striped table-hover shadow-sm">
          <thead className="table-info">
            <tr>
              <th><i className="bi bi-heart"></i> Wishlist ID</th>
              <th><i className="bi bi-person"></i> User Name</th>
              <th><i className="bi bi-book"></i> Book Name</th>
            </tr>
          </thead>
          <tbody>
            {wishlists.map((w) => (
              <tr key={w.id}>
                <td>{w.id}</td>
                <td>{w.user?.name}</td>
                <td>{w.book?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="fw-bold text-center mb-4">
        <i className="bi bi-info-circle-fill text-primary"></i> Information Page
      </h2>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3 justify-content-center">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <i className="bi bi-people"></i> Users
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "carts" ? "active" : ""}`}
            onClick={() => setActiveTab("carts")}
          >
            <i className="bi bi-cart4"></i> Carts
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "wishlists" ? "active" : ""}`}
            onClick={() => setActiveTab("wishlists")}
          >
            <i className="bi bi-heart-fill"></i> Wishlists
          </button>
        </li>
      </ul>

      {/* Table */}
      <div className="table-responsive">{renderTable()}</div>
    </div>
  );
};

export default InformationPage;