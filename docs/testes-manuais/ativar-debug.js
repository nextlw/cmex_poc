// Script para ativar modo debug para testes
localStorage.setItem("DEBUG_SSE", "true");
localStorage.setItem("DEBUG_PROGRESS", "true");
console.log(
  "%c🔍 Debug de testes ativado!",
  "color: green; font-size: 16px; font-weight: bold;"
);
console.log("Para desativar, execute:");
console.log('localStorage.removeItem("DEBUG_SSE")');
console.log('localStorage.removeItem("DEBUG_PROGRESS")');
