export const logout = () => {
  sessionStorage.clear();
  window.location.href = '/login';
};

export function isAuthenticated() {
    return !!sessionStorage.getItem("token");
}
  
export function getUserRole() {
    return sessionStorage.getItem("role"); 
}
