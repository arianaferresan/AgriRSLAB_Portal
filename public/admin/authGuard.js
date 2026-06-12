
(function() {
    const token = localStorage.getItem("token");

    const originalFetch = window.fetch.bind(window);
    window.fetch = (resource, options = {}) => {
        const url = typeof resource === "string" ? resource : resource.url;
        const shouldAttachToken = token && url && (
            url.startsWith("/api/") ||
            url.startsWith("http://localhost:3000/api/")
        );

        if (!shouldAttachToken) {
            return originalFetch(resource, options);
        }

        const headers = new Headers(options.headers || {});
        if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        return originalFetch(resource, {
            ...options,
            headers
        });
    };
    if (!token) {
        alert("Você precisa estar logado.");
        window.location.href = "/admin/login.html";
        return;
    }

    // Configura o botão de logout assim que o DOM estiver pronto
    window.addEventListener('DOMContentLoaded', () => {
        const logoutForm = document.getElementById('logoutForm');
        if (logoutForm) {
            logoutForm.addEventListener('submit', (e) => {
                e.preventDefault(); // Impede o envio do form para /logout
                localStorage.removeItem("token");
                window.location.href = "/admin/login.html";
            });
        }
    });
})();
