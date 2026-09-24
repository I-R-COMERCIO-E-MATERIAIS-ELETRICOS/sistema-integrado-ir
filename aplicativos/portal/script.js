function resolveToken() {
    const p = new URLSearchParams(window.location.search);
    const fromUrl = p.get('access_token');
    if (fromUrl) {
        sessionStorage.setItem('irToken', fromUrl);
        window.history.replaceState({}, '', window.location.pathname);
        return fromUrl;
    }
    return sessionStorage.getItem('irToken');
}

// No logout:
window.confirmLogout = () => {
    sessionStorage.removeItem('irToken');
    sessionStorage.removeItem('irUser');
    window.location.href = '/';
};
