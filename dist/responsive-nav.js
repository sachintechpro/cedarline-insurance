(function (root) {
  function createNavigation(documentRef, windowRef) {
    function setOpen(open) {
      var sidebar = documentRef.querySelector('.sidebar');
      var button = documentRef.querySelector('[data-action="menu"]');
      var topbar = documentRef.querySelector('.topbar');
      if (!sidebar || !button || !topbar) return;

      if (open && windowRef.matchMedia('(max-width: 720px)').matches) {
        var headerBottom = Math.max(0, Math.ceil(topbar.getBoundingClientRect().bottom));
        sidebar.style.setProperty('--mobile-nav-top', headerBottom + 'px');
      }
      sidebar.classList.toggle('mobile-open', Boolean(open));
      button.setAttribute('aria-expanded', String(Boolean(open)));
      button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    }

    function close() {
      setOpen(false);
    }

    function toggle() {
      var sidebar = documentRef.querySelector('.sidebar');
      setOpen(!(sidebar && sidebar.classList.contains('mobile-open')));
    }

    function updateOffset() {
      var sidebar = documentRef.querySelector('.sidebar');
      if (!sidebar || !sidebar.classList.contains('mobile-open')) return;
      var button = documentRef.querySelector('[data-action="menu"]');
      if (!windowRef.matchMedia('(max-width: 720px)').matches) {
        sidebar.classList.toggle('mobile-open', false);
        if (button) {
          button.setAttribute('aria-expanded', 'false');
          button.setAttribute('aria-label', 'Open navigation');
        }
        return;
      }
      var topbar = documentRef.querySelector('.topbar');
      if (topbar) {
        sidebar.style.setProperty('--mobile-nav-top', Math.max(0, Math.ceil(topbar.getBoundingClientRect().bottom)) + 'px');
      }
    }

    return { close: close, toggle: toggle, updateOffset: updateOffset };
  }

  root.cedarlineNavigation = createNavigation(root.document, root);
  if (root.document && root.addEventListener) {
    root.addEventListener('resize', root.cedarlineNavigation.updateOffset);
    root.document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') root.cedarlineNavigation.close();
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = createNavigation;
})(typeof window !== 'undefined' ? window : globalThis);
