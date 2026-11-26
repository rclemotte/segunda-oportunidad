# Segunda Oportunidad

Marketplace web de ropa, calzado y accesorios de segunda mano en Paraguay. *Todo merece otra oportunidad.*

- **Compradores**: exploran por categoría/talle/estado/precio, arman un carrito con prendas de uno o varios vendedores, eligen la entrega (delivery, encomienda o retiro en punto) y pagan **por transferencia** adjuntando el comprobante.
- **Vendedores**: se registran (datos, foto de cédula, cuenta de cobro: todo privado), publican en dos minutos desde el celular y ven al instante cuánto reciben después de la comisión. Cobran cuando el comprador recibe la prenda.
- **Admin**: valida transferencias, aprueba vendedores, coordina pedidos y registra las liquidaciones.

Stack: Next.js 14 (App Router) + TypeScript + Tailwind 3 + Supabase (Postgres, Auth, Storage, RLS) + Vercel. Es una PWA: se puede instalar en el celular.

---

## Puesta en marcha (paso a paso)

Necesitás: una cuenta de GitHub (ya está), una de **Supabase** y una de **Vercel**. Las dos son gratis para empezar.

### 1. Crear el proyecto en Supabase

1. Entrá a <https://supabase.com> → **Start your project** → iniciá sesión con GitHub.
2. **New project**: nombre `segunda-oportunidad`, una contraseña fuerte para la base (guardala), región **South America (São Paulo)**.
3. Cuando termine de crearse, andá a **SQL Editor → New query** y ejecutá, **en este orden**, el contenido de cada archivo (copiar, pegar, **Run**):
   1. `supabase/migrations/0001_esquema.sql`
   2. `supabase/migrations/0002_seguridad_y_funciones.sql`
   3. `supabase/migrations/0003_storage.sql`
   4. `supabase/migrations/0004_permisos.sql` (da acceso a la app a las tablas; sin esto nada carga)

   Cada uno tiene que terminar con *Success. No rows returned*.
4. **Authentication → Sign In / Providers → Email**: dejá activado *Email*. Para las primeras pruebas podés desactivar **Confirm email** (así no hace falta confirmar por correo); activalo antes de abrir al público.
5. **Project Settings → API** (o **Connect**): copiá
   - **Project URL** → va en `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   La *service_role key* **no** se usa ni se pone en ningún lado.

### 2. Publicar en Vercel

1. Entrá a <https://vercel.com> → iniciá sesión con GitHub → **Add New… → Project** → importá `rclemotte/segunda-oportunidad`.
2. Framework: Next.js (lo detecta solo). En **Environment Variables** cargá:

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key de Supabase |
   | `NEXT_PUBLIC_SITE_URL` | la URL que te dé Vercel, ej. `https://segunda-oportunidad.vercel.app` |
   | `TRANSFERENCIA_BANCO` | banco de la cuenta de Ángel |
   | `TRANSFERENCIA_TITULAR` | titular de la cuenta |
   | `TRANSFERENCIA_CUENTA` | número de cuenta |
   | `TRANSFERENCIA_DOCUMENTO` | CI o RUC del titular |
   | `TRANSFERENCIA_ALIAS` | alias para transferencias (opcional) |
   | `NEXT_PUBLIC_WHATSAPP_SOPORTE` | WhatsApp de soporte, ej. `595981123456` (opcional) |

3. **Deploy**. Cada push a `main` vuelve a publicar solo.
4. Volvé a Supabase → **Authentication → URL Configuration**:
   - **Site URL**: la URL de Vercel.
   - **Redirect URLs**: agregá `https://TU-URL.vercel.app/auth/callback` (y `http://localhost:3000/auth/callback` para desarrollo).

### 3. Crear el primer administrador

1. Registrate en la app con tu email (botón de perfil → *Registrate*).
2. En Supabase → **SQL Editor**, ejecutá (con tu email):

   ```sql
   update public.perfiles set rol = 'admin' where email = 'tu-email@ejemplo.com';
   ```

3. Volvé a entrar a la app: aparece **Admin** en el menú y en *Mi perfil*. Repetí para Ángel.

### 4. Ajustes que se cambian sin tocar código (SQL Editor o Table Editor)

- **Comisión** (15% por defecto): tabla `ajustes`, clave `comision_pct`.
- **Tarifas de envío** (Gs. 20.000 delivery, Gs. 25.000 encomienda, retiro gratis): tabla `tarifas_envio`. Se cobra un envío por cada vendedor del carrito. Con `activo = false` se oculta una opción.

---

## Cómo circula un pedido

```
Comprador paga por transferencia y adjunta comprobante
  → compra "Validando transferencia", prendas "reservadas" (nadie más las puede comprar)
Admin verifica en la banca web → Aprobar pago
  → prendas "vendidas", pedido "Preparar envío", saldo del vendedor "retenido"
  (Rechazar → las prendas vuelven al catálogo)
Vendedor (o admin) marca "Despachado" con número de guía → "En camino"
Comprador toca "Llegó bien" (o admin marca "Entregado")
  → saldo del vendedor "disponible"
Admin transfiere al vendedor y toca "Registrar transferencia" → saldo "pagado"
```

Una compra con prendas de dos vendedores es **un pago y dos pedidos**, cada uno con su envío y su liquidación.

## Seguridad y privacidad

- Toda tabla tiene **Row Level Security**. Cédula, WhatsApp y cuenta del vendedor (`vendedores_privado`, `cuentas_cobro`) solo los ven el dueño y los admins. El comprador ve el alias, la ciudad y si está verificado.
- Fotos de cédula y comprobantes van a buckets **privados**; el admin los ve con URLs firmadas de 10 minutos y cada apertura de datos KYC queda en `auditoria`.
- Los cambios de estado que mueven dinero (crear compra, aprobar/rechazar pago, despachar, entregar, cancelar, liquidar) pasan por funciones SQL que validan quién llama. El navegador no puede marcar una prenda como vendida ni aprobarse a sí mismo.
- Un vendedor puede publicar desde el primer momento, pero solo se le liquida cuando un admin aprobó su identidad y su cuenta. Si cambia la cuenta, se vuelve a verificar.
- Las publicaciones no aceptan teléfonos, emails ni links (para que la venta no salga de la plataforma).

## Desarrollo local

```bash
cp .env.example .env.local   # completá con los datos de Supabase
npm install
npm run dev                  # http://localhost:3000
```

Otros comandos: `npm run build`, `npm run lint`, `npm run typecheck`.

## Estructura

```
src/app/                 páginas (App Router): page.tsx + actions.ts + *Form.tsx por pantalla
  buscar/ prenda/[id]/ carrito/ checkout/ favoritos/   compra
  vender/ vender/publicar/ vender/prendas/ vender/datos/ venta
  cuenta/ cuenta/compras/[id]/                          comprador
  admin/ (pagos, pedidos, vendedores, liquidaciones, prendas)
src/components/          Encabezado, BarraInferior, TarjetaPrenda, Logo, ui/*
src/lib/                 supabase (cliente/servidor), format (Gs. y fechas), catalogo, imagen
supabase/migrations/     esquema SQL, RLS y funciones
tailwind.config.ts       tokens de marca (violeta #3A0D66, lima #D9FF00, carbón #2B2B2B)
```

## Pendiente para próximas fases

- **Pagopar** (tarjetas, QR, billeteras) en lugar de la transferencia manual.
- Avisos automáticos por WhatsApp/email (hoy el admin escribe desde el panel con links a WhatsApp).
- Reclamos con fotos, calificaciones, cierre automático de pedidos sin reclamo a las 48 h.
- Carrito y favoritos sincronizados entre dispositivos (hoy se guardan en el navegador).
- Verificación del celular por código.
