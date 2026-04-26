/**
 * Lotérica Central - Proteção de Código Fonte
 * Este script dificulta a inspeção e cópia do código front-end.
 */

(function() {
  // 1. Bloquear Clique Direito
  document.addEventListener('contextmenu', e => e.preventDefault());

  // 2. Bloquear Atalhos de Teclado (F12, Ctrl+U, Ctrl+Shift+I, etc.)
  document.addEventListener('keydown', e => {
    // F12
    if (e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
      e.preventDefault();
      return false;
    }
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.keyCode === 85) {
      e.preventDefault();
      return false;
    }
    // Ctrl+S (Save Page)
    if (e.ctrlKey && e.keyCode === 83) {
      e.preventDefault();
      return false;
    }
  });

  // 3. Bloquear Seleção de Texto (Opcional, mas ajuda contra cópia casual)
  const style = document.createElement('style');
  style.innerHTML = `
    * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }
    input, textarea {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
  `;
  document.head.appendChild(style);

  // 4. Loop de Debugger (Pausa a execução se o DevTools for aberto)
  // Nota: Isso pode ser irritante para o dono do site se ele quiser inspecionar,
  // mas é muito eficaz contra curiosos.
  setInterval(function() {
    (function(a) {
      return (function(a) {
        return (function(a) {
          (function() {
            (function() {
              return (function(a) {
                return (function(a) {
                  return function(a) {
                    return a;
                  }(a);
                }(a));
              }(a));
            }());
          }());
        }(a));
      }(a));
    }("bugger")("de" + "v").constructor("debugger")());
  }, 1000);

  console.log("%c Lotérica Central - Proteção Ativa ", "color: white; background: red; font-size: 20px; font-weight: bold;");
})();
