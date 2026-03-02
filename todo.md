# Mushoku Tensei Slots — TODO

## Backend / Base de Datos
- [x] Schema: users, wallets, coinTransactions, creditPackages, paymentOrders, spinHistory, jackpot, products, redemptions
- [x] pnpm db:push para aplicar schema (9 tablas migradas)
- [x] Helpers DB: wallet, transacciones, historial de giros, jackpot, productos, canjes
- [x] Router: wallet (balance en tiempo real)
- [x] Router: slots (spin con RTP 62%, algoritmo antifraude, jackpot progresivo)
- [x] Router: shop (paquetes de créditos, createPaypalOrder, capturePaypalOrder)
- [x] Router: products (catálogo, redeem con formulario de envío)
- [x] Antifraude: límite de 30 giros por minuto por usuario

## Frontend
- [x] Subir imágenes al CDN permanente
- [x] Tema oscuro fantasy (colores OKLCH, fuentes Cinzel)
- [x] index.css con variables de color y animaciones
- [x] client/index.html con fuentes Google (Cinzel, Nunito)
- [x] App.tsx con rutas: /, /play, /shop, /history, /redeem
- [x] Página Home: banner, personajes, paquetes de créditos, cómo funciona
- [x] Página Play: máquina tragamonedas 5 rodillos, tabla de pagos, auto-giro
- [x] Página Shop: paquetes de créditos con botón PayPal SDK
- [x] Página History: historial de giros con resumen
- [x] Página Redeem: catálogo de productos, formulario de envío, mis canjes
- [x] Componente Navbar con balance de monedas y puntos en tiempo real
- [x] Modal de gran victoria con confeti
- [x] Jackpot progresivo en tiempo real (polling 5s)

## Integración PayPal
- [x] createPaypalOrder desde backend (seguro, sin exponer credenciales)
- [x] capturePaypalOrder con acreditación automática de monedas
- [ ] Configurar credenciales PayPal reales (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, VITE_PAYPAL_CLIENT_ID)

## Tests
- [x] Test: auth logout (cookie clearing)
- [x] Test: RTP del motor de slots (< 70%, la casa siempre gana)
- [x] Test: wallet separación monedas/puntos
- [x] Test: jackpot incremento y reset
- [x] Test: validación de apuestas (min/max)
- [x] Test: matemáticas de paquetes de créditos
