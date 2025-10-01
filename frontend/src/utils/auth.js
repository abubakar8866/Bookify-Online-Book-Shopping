export const logout = () => { localStorage.removeItem('token'); window.location.href = '/login'; };

export function isAuthenticated() {
    return !!localStorage.getItem("token");
}
  
export function getUserRole() {
    return localStorage.getItem("role"); 
}
