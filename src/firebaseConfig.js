// Configuración de Firebase (proyecto donde se guardan las respuestas en tiempo real).
// Estos datos NO son secretos: Firebase los diseñó para ir dentro de la página web.
// La seguridad la dan las "reglas" de Firestore (archivo firestore.rules).
//
// Si este objeto queda vacío, la aplicación funciona en "modo demostración":
// guarda todo solo en el navegador actual (sirve para probar, no para un grupo real).
export const firebaseConfig = {
  apiKey: 'AIzaSyCOG8czz94ZrgCbFQTMBXxnV6-3jLki07w',
  authDomain: 'pulso-experiencia.firebaseapp.com',
  projectId: 'pulso-experiencia',
  storageBucket: 'pulso-experiencia.firebasestorage.app',
  messagingSenderId: '25749077638',
  appId: '1:25749077638:web:516cc496e0e0c9ed39db07',
};
