(function () {
  const adminFooterHtml = `
    <footer class="admin-footer">
      <div class="mensagem-admin">
        2025 AgrisLab | Feito por equipe
        <a href="https://github.com/404NotFound-ABP/AgriRSLAB_Portal">
          Fatec 404 Not Found
          <svg class="link-externo" width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g id="Interface / External_Link">
              <path id="Vector" d="M10.0002 5H8.2002C7.08009 5 6.51962 5 6.0918 5.21799C5.71547 5.40973 5.40973 5.71547 5.21799 6.0918C5 6.51962 5 7.08009 5 8.2002V15.8002C5 16.9203 5 17.4801 5.21799 17.9079C5.40973 18.2842 5.71547 18.5905 6.0918 18.7822C6.5192 19 7.07899 19 8.19691 19H15.8031C16.921 19 17.48 19 17.9074 18.7822C18.2837 18.5905 18.5905 18.2839 18.7822 17.9076C19 17.4802 19 16.921 19 15.8031V14M20 9V4M20 4H15M20 4L13 11" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </g>
          </svg>
        </a>
      </div>
    </footer>
  `;

  const adminPages = [
    { href: "artigos-admin.html", label: "Artigos" },
    { href: "noticias-admin.html", label: "Not\u00EDcias" },
    { href: "membros-admin.html", label: "Membros" },
    { href: "projetos-admin.html", label: "Projetos" },
    { href: "vagas-admin.html", label: "Vagas" },
    { href: "sobre-admin.html", label: "Sobre" },
  ];

  function renderAdminHeader() {
    const mount = document.getElementById("admin-header");
    if (!mount) return;

    const isLoginPage = window.location.pathname.endsWith("/login.html");
    const header = document.createElement("header");
    const headerTop = document.createElement("div");
    const logo = document.createElement("img");
    const title = document.createElement("h1");

    headerTop.className = "headerTop";
    logo.className = "imageLogo";
    logo.src = "/assets/Imagens do laboratorio/logo.png";
    logo.alt = "";
    title.className = "h1HEADER";
    title.textContent = "Painel Administrativo";

    if (!isLoginPage) {
      const menuButton = document.createElement("button");
      menuButton.className = "admin-menu-toggle";
      menuButton.type = "button";
      menuButton.setAttribute("aria-label", "Abrir menu administrativo");
      menuButton.setAttribute("aria-controls", "admin-sidebar-panel");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.innerHTML = "<span></span><span></span><span></span>";
      headerTop.appendChild(menuButton);
    }

    headerTop.append(logo, title);

    if (!isLoginPage) {
      const logoutForm = document.createElement("form");
      const logoutButton = document.createElement("button");
      const logoutText = document.createElement("span");

      logoutForm.id = "logoutForm";
      logoutForm.action = "/logout";
      logoutForm.method = "POST";
      logoutForm.style.display = "inline";
      logoutButton.className = "button-logout";
      logoutButton.type = "submit";
      logoutButton.setAttribute("aria-label", "Sair");
      logoutButton.title = "Sair";
      logoutButton.innerHTML = `
        <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12.9999 2C10.2385 2 7.99991 4.23858 7.99991 7C7.99991 7.55228 8.44762 8 8.99991 8C9.55219 8 9.99991 7.55228 9.99991 7C9.99991 5.34315 11.3431 4 12.9999 4H16.9999C18.6568 4 19.9999 5.34315 19.9999 7V17C19.9999 18.6569 18.6568 20 16.9999 20H12.9999C11.3431 20 9.99991 18.6569 9.99991 17C9.99991 16.4477 9.55219 16 8.99991 16C8.44762 16 7.99991 16.4477 7.99991 17C7.99991 19.7614 10.2385 22 12.9999 22H16.9999C19.7613 22 21.9999 19.7614 21.9999 17V7C21.9999 4.23858 19.7613 2 16.9999 2H12.9999Z" fill="#fff" />
          <path d="M13.9999 11C14.5522 11 14.9999 11.4477 14.9999 12C14.9999 12.5523 14.5522 13 13.9999 13V11Z" fill="#fff" />
          <path d="M5.71783 11C5.80685 10.8902 5.89214 10.7837 5.97282 10.682C6.21831 10.3723 6.42615 10.1004 6.57291 9.90549C6.64636 9.80795 6.70468 9.72946 6.74495 9.67492L6.79152 9.61162L6.804 9.59454L6.80842 9.58848C6.80846 9.58842 6.80892 9.58778 5.99991 9L6.80842 9.58848C7.13304 9.14167 7.0345 8.51561 6.58769 8.19098C6.14091 7.86637 5.51558 7.9654 5.19094 8.41215L5.18812 8.41602L5.17788 8.43002L5.13612 8.48679C5.09918 8.53682 5.04456 8.61033 4.97516 8.7025C4.83623 8.88702 4.63874 9.14542 4.40567 9.43937C3.93443 10.0337 3.33759 10.7481 2.7928 11.2929L2.08569 12L2.7928 12.7071C3.33759 13.2519 3.93443 13.9663 4.40567 14.5606C4.63874 14.8546 4.83623 15.113 4.97516 15.2975C5.04456 15.3897 5.09918 15.4632 5.13612 15.5132L5.17788 15.57L5.18812 15.584L5.19045 15.5872C5.51509 16.0339 6.14091 16.1336 6.58769 15.809C7.0345 15.4844 7.13355 14.859 6.80892 14.4122L5.99991 15C6.80892 14.4122 6.80897 14.4123 6.80892 14.4122L6.804 14.4055L6.79152 14.3884L6.74495 14.3251C6.70468 14.2705 6.64636 14.1921 6.57291 14.0945C6.42615 13.8996 6.21831 13.6277 5.97282 13.318C5.89214 13.2163 5.80685 13.1098 5.71783 13H13.9999V11H5.71783Z" fill="#fff" />
        </svg>
      `;
      logoutText.textContent = "Sair";
      logoutButton.appendChild(logoutText);
      logoutForm.appendChild(logoutButton);
      headerTop.appendChild(logoutForm);
    }

    header.appendChild(headerTop);
    mount.replaceChildren(header);
  }

  function renderAdminSidebar() {
    const mount = document.getElementById("admin-sidebar");
    if (!mount) return;

    const currentPage = window.location.pathname.split("/").pop() || "artigos-admin.html";
    const backdrop = document.createElement("button");
    const sidebar = document.createElement("div");

    backdrop.className = "admin-sidebar-backdrop";
    backdrop.type = "button";
    backdrop.setAttribute("aria-label", "Fechar menu administrativo");
    sidebar.className = "sidebar";
    sidebar.id = "admin-sidebar-panel";
    sidebar.setAttribute("role", "navigation");
    sidebar.setAttribute("aria-label", "Menu administrativo");

    adminPages.forEach((page) => {
      const link = document.createElement("a");
      link.href = page.href;
      link.textContent = page.label;
      link.className = page.href === currentPage ? "admin-atual" : "admin-selecionavel";
      if (page.href === currentPage) link.setAttribute("aria-current", "page");
      sidebar.appendChild(link);
    });

    const siteDivider = document.createElement("div");
    siteDivider.className = "sidebar-divider";
    sidebar.appendChild(siteDivider);

    const siteLink = document.createElement("a");
    siteLink.className = "voltar-ao-site";
    siteLink.target = "_blank";
    siteLink.rel = "noopener";
    siteLink.href = "/pagina-inicial/";
    siteLink.textContent = "Voltar ao site";
    sidebar.appendChild(siteLink);

    mount.replaceChildren(backdrop, sidebar);
  }

  function closeAdminMenu() {
    document.body.classList.remove("admin-menu-open");
    const button = document.querySelector(".admin-menu-toggle");
    if (button) button.setAttribute("aria-expanded", "false");
  }

  function bindAdminMenu() {
    const button = document.querySelector(".admin-menu-toggle");
    const backdrop = document.querySelector(".admin-sidebar-backdrop");
    const sidebar = document.querySelector(".sidebar");

    if (button) {
      button.addEventListener("click", () => {
        const isOpen = document.body.classList.toggle("admin-menu-open");
        button.setAttribute("aria-expanded", String(isOpen));
      });
    }

    if (backdrop) {
      backdrop.addEventListener("click", closeAdminMenu);
    }

    if (sidebar) {
      sidebar.addEventListener("click", (event) => {
        if (event.target.closest("a")) closeAdminMenu();
      });
    }

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAdminMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) closeAdminMenu();
    });
  }

  function renderAdminFooter() {
    const mount = document.getElementById("admin-footer");
    if (!mount) return;

    mount.className = "admin-footer-wrapper";
    mount.innerHTML = adminFooterHtml;
  }

  function renderAdminUi() {
    renderAdminHeader();
    renderAdminSidebar();
    renderAdminFooter();
    bindAdminMenu();
  }

  window.renderAdminHeader = renderAdminHeader;
  window.renderAdminSidebar = renderAdminSidebar;
  window.renderAdminFooter = renderAdminFooter;
  window.renderAdminUi = renderAdminUi;
  document.addEventListener("DOMContentLoaded", renderAdminUi);
})();
