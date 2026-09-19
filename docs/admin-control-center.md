# Admin Control Center — uygulama ve işletim raporu

Bu çalışma yalnızca local implementasyon ve izole testlerdir. Production sunucusuna bağlantı, production migration, deploy, PM2 restart veya commit yapılmadı. Başlangıç çalışma ağacı temizdi; `git add -A` kullanılmadı. Mevcut `data/rooms.db` yalnızca salt okunur incelendi; bütünlük kontrolü `ok` döndü. Aşağıdaki production komutları **çalıştırılmadı**.

**19 Eylül 2026 güncellemesi:** Yukarıdaki paragraf ilk local teslimin durumudur. Implementasyon daha sonra kullanıcı onayıyla `c632992` commit'i olarak `origin/master` üzerine gönderildi. İlk Linux CI çalıştırmasında 64/65 E2E geçti; karakter seçimi senaryosundaki 5 saniyelik assertion süresi, uygulamanın 5 saniyelik polling aralığıyla çakışıyordu. Yalnızca bu assertion, iki polling turu ve mesaj teslimi için 12 saniyeye çıkarıldı; kontrol kaldırılmadı, otomatik retry eklenmedi ve oyun kodu değiştirilmedi. Hedef senaryo 5/5 tekrarda, tam E2E paketi 65/65 senaryoda (5.7 dakika), 369 unit testi, typecheck ve lint yeniden başarılı oldu. E2E öncesindeki production build, import kontrolü ve smoke testi de geçti. Production ortamı belirlenemediği için migration, deploy veya canlı süreç değişikliği yapılmadı.

## İncelenen mimari

- Express ve Socket.IO aynı HTTP server üzerinde çalışıyor. Derlenmiş giriş `node dist/server/index.js` olarak korundu.
- `RoomStore` arayüzünün MemoryStore ve better-sqlite3 implementasyonları var. SQLite WAL kullanıyor; oda güncellemeleri `BEGIN IMMEDIATE` transaction ile yapılıyor. Oyun durumları ve oyuncular `rooms` tablosunda JSON alanları olarak saklanıyor.
- Gerçek local DB ilk sürümün sekiz sütunlu `rooms` şemasını taşıyor. Mevcut store, eksik sütunları ekleyip sonrasında index oluşturuyor. Yeni tablolar mevcut odaları silmeden ekleniyor.
- `domain/engine.ts` faz geçişleri, bitişler ve deadline yakalamayı; socket handler'ları host/oyuncu yetkilerini yönetiyor. Mevcut “admin” socket olayları **oda sahibine** aittir. Yeni site yöneticisi authentication sistemi bunlardan tamamen ayrı.
- Sekiz oyun static server kataloğunda. Public client vanilla TypeScript, lazy view router, dört dil ve local/offline oyun akışını kullanıyor. Kapaklar ve dünya arka planları Vite ile content-hash alıyor.
- Service worker public shell ve asset'leri cache'liyor. Yeni sürüm `/admin*`, admin API'leri, `/health` ve `/control.html` isteklerini cache dışı bırakıyor.

## Oluşturulan ve değiştirilen dosyalar

| Dosya/grup | Değişiklik |
|---|---|
| `src/server/control/database.ts` | Eklemeli ve tekrar çalıştırılabilir schema, SQLite açılışı, audit yazımı |
| `src/server/control/auth.ts` | scrypt, hash'lenmiş oturum, CSRF, kalıcı rate limit |
| `src/server/control/analytics.ts` | RoomStore gözlemcisi, event/history kayıtları, SQL KPI'ları, retention |
| `src/server/control/content.ts` | Upload doğrulama/yeniden kodlama, override, public config, HTML metadata, gecikmeli cleanup |
| `src/server/control/routes.ts` | Korumalı sayfalar/API'ler, login/logout, pagination, sistem durumu |
| `src/server/control/cli.ts` | Güvenli hesap CLI, backup, migration, cleanup |
| `control.html`, `src/client/control/main.ts`, `style.css` | Bağımsız responsive panel, sidebar/drawer, grafikler, tablolar, preview, confirmation, toast |
| `src/client/services/publicConfig.ts`, `analytics.ts` | Public override/branding ve first-party ziyaretçi ölçümü |
| `src/client/main.ts`, `router.ts` | Config yükleme, bootstrap heartbeat, view event'leri |
| `src/client/data/assets.ts`, `worldDetails.ts`, `views/home.ts`, `views/gameInfo.ts` | Bundled fallback korunarak dört görsel slotu ve logo/site adı entegrasyonu |
| `src/server/index.ts` | Admin mount, persistent path kontrolü, health, gözlemci store, shutdown |
| `src/server/store/store.ts`, `sockets/admin-handlers.ts` | Yeni oda için aktiflik kontrolü ve yeniden rol dağıtımı gözlemi |
| `src/server/domain/settings.ts`, `spyWords.ts` | Production'da çözülmeyen iki gerçek `@shared/` value importunun relative importlara düzeltilmesi |
| `scripts/verify-server-build.mjs`, `smoke-production.mjs` | Derlenmiş import kontrolü, gerçek Node giriş noktasıyla izole smoke |
| `scripts/test-build-persistence.mjs`, `health-gate.mjs` | Rebuild kalıcılık testi, yalnızca loopback health geçidi |
| `tests/unit/control/control.test.ts`, `tests/e2e/control-center.spec.ts` | Güvenlik, veri, upload, responsive, Socket.IO, service-worker testleri |
| `package.json`, `package-lock.json` | sharp, güvenlik yamalı dependency sürümleri, build/start/CLI/test komutları |
| `vite.config.ts`, `public/sw.js` | Ayrı admin HTML entrypoint, dev proxy, güvenli cache politikası |
| `playwright.config.ts`, `.github/workflows/ci.yml` | İzole E2E portu, mevcut server'ı tekrar kullanmama, Node 22, kalıcılık testi ve production audit |
| `.env.example`, `README.md`, bu rapor | Yapılandırma ve health kontrolü öncesi restart içermeyen işletim komutları |

## Veritabanı

Ana tablolar: `admin_users`, `admin_sessions`, `analytics_visitors`, `analytics_events`, `game_sessions`, `game_asset_overrides`, `site_settings`, `admin_audit_logs`.

Yardımcı tablolar: `admin_schema`, `admin_login_limits`, `admin_uploads`. `site_settings`, istenen settings deposudur; public endpoint yalnızca belirlenmiş branding anahtarlarını döndürür.

Username unique ve case-insensitive; oturumlar admin foreign key'i taşır. Upload referansları foreign key ile korunur. Oda başına yalnızca bir running game session için partial unique index vardır. Event türü/zaman, ziyaretçi/zaman, oyun/zaman, oda/event, history sıralaması ve audit sorguları index'lidir. SQLite bağlantısının busy timeout'u 250 ms; analytics hataları yakalanır ve oyuna fırlatılmaz. Yeni dosyalar Unix'te 0600, yeni özel dizinler 0700 açılır; Windows erişimi NTFS izinlerine tabidir.

Migration admin tablolarını tek transaction'da oluşturur. Production'da eksik admin şeması sessizce oluşturulmaz: önce CLI migration gerekir. Oda şemasının mevcut eklemeli migration yaklaşımı korunmuştur. Backup için canlı WAL dosyasını kopyalamak yerine better-sqlite3 online backup API kullanılır; backup üzerinde `integrity_check` doğrulanır. Backup klasörü `dist` altında olamaz.

## Güvenlik kararları

- Parola: scrypt `N=131072, r=8, p=1`, rastgele 128-bit salt, 64-byte hash; 14–128 karakter. Asenkron hesaplama ve en fazla iki eşzamanlı login hash işlemi. [OWASP parola saklama rehberi](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- Session: 256-bit rastgele token, DB'de SHA-256 hash; 8 saat mutlak süre ve 30 dakika hareketsizlik süresi. Production cookie `__Host-yalla-admin`, `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`. Parola değişikliği/hesap kapatma oturumları iptal eder.
- Her `/api/admin/*` rotasında authentication middleware; tüm mutation'larda session'a bağlı CSRF header ve exact Origin doğrulaması. Login ayrıca pre-auth CSRF cookie/header kullanır. CSRF token'ı DB'de hash'li tutulur ve farklı browser tab'larında stabildir.
- Login limitleri 15 dakikada hesap başına 8, kaynak başına 10 deneme; SQLite'da kalıcıdır. Kaynak anahtarı server salt'ıyla hash'lenir; ham IP saklanmaz. Bilinmeyen kullanıcı için de scrypt çalışır. Başarısız login ve rate-limit reddi audit'e yazılır.
- Logout GET sayfası gösterir; session sonlandırma yalnızca CSRF doğrulanan POST ile gerçekleşir. Admin HTML ve API cevapları `no-store`, `noindex` kullanır.
- Upload: 5 MiB, 4096×4096 ve 16 MP sınırı; yalnızca tek kare JPEG/PNG/WebP. Dosya uzantısı kullanılmaz; decoder formatı kontrol edilir ve **tüm içerik yeniden WebP'ye kodlanır**, EXIF/metadata taşınmaz. SVG kabul edilmez. [sharp input sınırları](https://sharp.pixelplumbing.com/api-constructor/).
- Rastgele dosya adı, sabit upload kökü, whitelist URL ve path kontrolü; admin hiçbir dosya yolu belirleyemez. Eski görsel reset/save sırasında silinmez. CLI cleanup önce referanssız dosyayı işaretler; sonraki çalıştırmada en az 7 gün geçmişse kaldırır. Referans kontrolü/işaretleme transaction içindedir.
- Branding metinleri frontend'de `textContent`, HTML metadata'da escape ile yazılır. Public config'te admin, oyuncu listesi, parola hash'i veya internal salt yoktur.
- Sistem paneli yalnızca version/Node/uptime/database/disk/health özetidir. Shell çalıştırma endpoint'i yoktur.
- Audit kayıtları actor/action/target/time ve whitelist metadata taşır; parola, cookie, session veya oyun erişim token'ı içermez.

## Ölçüm anlamları ve sınırlar

- Ziyaretçi kimliği first-party HttpOnly anonim cookie'dir; DB'de hash'i vardır. Aynı kimliğin tekrar sayfa açması yeni page_view üretir, aynı tarih aralığında yeni unique visitor üretmez. Cookie silinmesi/yeni cihaz yeni ziyaretçi sayılır.
- `page_view` public view değişimleridir. `room_created`, `player_joined`, `game_started`, `game_completed`, `room_closed` başarılı server state değişimlerinden gelir. İsimler yalnızca kabul edilmiş oyuncular için kaydedilir. Analytics oyuncu listesi yalnızca admin API'sindedir; mevcut oyun içi isim görünümü korunur.
- Online: son 90 saniyede aktif anonim tarayıcı. Görünür sekme 30 saniyede heartbeat gönderir. Bu, socket veya tekil insan sayısı değildir.
- Tarihler/gün sınırları UTC'dir; ekran bunu belirtir. Filtre bugün/7/30/90/tüm zamanlar; tüm zamanlar seçiliyken günlük çizelgeler son 90 günü gösterir. Toplamlar saklama süresi içinde kalan veriyi ifade eder.
- İlk kurulum öncesindeki geçmiş için veri uydurulmaz/backfill yapılmaz. Offline local-play turları server tarafından doğrulanamadığından oyun başlangıç/bitiş sayısına eklenmez; online local view ziyareti page_view olarak sayılabilir.
- Tur motorlarının `GAME_OVER` fazı tamamlanma sayılır. Manuel rol oyunlarının gerçek fiziksel bitiş sinyali yoktur: rol dağıtımı başlangıç, yeniden dağıtım/clear/oda kapanışı önceki oturumu yarım kaldı olarak kapatır. Başarı varsayılmaz.
- Retention `ANALYTICS_RETENTION_DAYS` (varsayılan 365; 1–3650) ile ayarlanır; saatlik temizlik vardır. Audit log ayrı korunur, analytics retention ile silinmez. Audit büyümesi ve backup saklama politikası operatör sorumluluğundadır.
- Analytics oyundan ayrı, best-effort yazılır. Disk/locking hatasında oyun sürer; kayıp event'ler için kalıcı retry kuyruğu yoktur. Uygulama log'una dakika başına en fazla bir genel uyarı yazılır.
- Oyunu kapatmak katalogdan kaldırır ve **yeni** Socket.IO odalarını engeller; mevcut odalar sürer. Daha önce indirilmiş offline kopyalar uzaktan iptal edilemez.
- Panel dili İngilizcedir; layout logical CSS, keyboard, ARIA, modal focus ve RTL viewport testleri içerir. Public oyunun dört dili korunur. MFA/SSO ve admin hesabı web CRUD'u kapsamda değildir; hesaplar CLI'dan yönetilir.
- Tek Node instance + yerel SQLite mimarisi korunur. Socket.IO adapter olmadan birden çok instance'a oyun trafiği dağıtılmamalıdır. Deploy geçişinde aktif socket'ler reconnect edebilir; kesintisiz dağıtık oda iddiası yoktur.

## Local komutlar

Node **22.12+** gerekir; bu ortamda Node 24.13.1 ile doğrulandı. Vite 7 ve Vitest 4 güvenlik yamaları için araç zinciri güncellendi; CI Node 22 kullanır. [Vite Node gereksinimleri](https://vite.dev/blog/announcing-vite7), [Vitest geçiş rehberi](https://vitest.dev/guide/migration.html).

PowerShell, proje kökünde (bunları kendi hesabını oluşturmak için kullanıcı çalıştırır; varsayılan hesap oluşturulmadı):

```powershell
npm ci
$env:DB_PATH = 'C:\laragon\www\YallaGame\data\rooms.db'
$env:UPLOAD_DIR = 'C:\laragon\www\YallaGame\data\uploads'
$env:BACKUP_DIR = 'C:\laragon\www\YallaGame\data\backups'
npm run admin:cli -- migrate
npm run admin:cli -- create operator
npm run dev
```

Panel: `http://localhost:5173/admin`. Parola terminalde echo edilmeden iki kez sorulur; argv/env/stdin pipe ile parola verilmesi desteklenmez. Kaynak kod tarafında `.env` otomatik okunmaz; ortam değişkenlerini shell/PM2 üzerinden verin.

Hesap kimliği olarak kullanıcı adı veya e-posta adresi kullanılabilir (3–64 karakter). Baştaki/sondaki boşluklar temizlenir ve kimlik küçük harfe çevrilir. Örnek: `npm run admin:cli -- create operator@example.com`. Bu, e-posta gönderimi veya adres doğrulaması yapmaz; adres yalnızca giriş kimliğidir. Parola alt sınırı 14 karakterdir.

```powershell
npm run admin:cli -- password operator
npm run admin:cli -- disable operator
npm run admin:cli -- cleanup
npm run admin:cli -- cleanup-apply
```

`cleanup` dry-run; `cleanup-apply` önce işaretler, 7 günlük grace sonrası tekrar çalıştırmada siler. Doğrulanmış backup alınmadan production bakım işlemi yapmayın.

## Test ve build sonuçları

- `npm run typecheck`: geçti.
- `npm run lint`: geçti.
- `npm test -- --coverage`: **24 dosya, 369 test geçti**. Mevcut coverage kapsamı `server/domain` ve `server/store`: satır %99.63, statement %95.76, branch %87.12, function %100; mevcut eşikler değişmedi. Yeni admin testleri ayrıca bu 369 test içinde, bu coverage yüzdeleri admin modülünü kapsamıyor.
- `npm run test:e2e`: **65/65 senaryo geçti**. Son dependency/build değişiklikleriyle 17 Eylül 2026 tarihinde yapılan tam tekrar 5.8 dakikada başarılı tamamlandı; retry kullanılmadı.
- Yeni güvenlik testleri authentication reddi, yanlış parola/rate limit/audit, Secure cookie, idle/absolute expiry, disabled hesap, logout, origin/CSRF, hash'lenmiş session, tab'lar arası CSRF, anonymous dedup, event/history/popularity, analytics hata izolasyonu, migration idempotency, upload içerik/boyut/çözünürlük/path, override/reset/cleanup, HTML escape ve retention içerir.
- Admin E2E: gerçek production server, her çalıştırmada rastgele ve yalnızca test process belleğinde üretilen parola, ayrı geçici SQLite ve upload kökü. Desktop/mobile/RTL, save/preview/reset, public branding, disabled oyunun socket reddi ve service-worker cache sınırı doğrulandı.
- Mevcut E2E: oda create/join/approve/reject/reconnect/privacy, avatarlar, local/offline, dört dilde düzen, Most Likely To, Bluff Trivia ve Secret Politician senaryoları korunuyor. Test server artık mevcut açık uygulamayı kullanmaz; varsayılan E2E portu 3100 (`E2E_PORT` ile değişir).
- `npm run build`: geçti; 33 derlenmiş server modülünde çözülmeyen `@shared/` import kontrolü + Vite client build + gerçek entrypoint smoke başarılı.
- `npm run test:build-persistence`: geçti; gerçek production rebuild'den sonra ayrı geçici DB'deki override, upload dosyasının byte'ları, public config ve HTTP görsel sunumu korunuyor.
- `npm audit` ve `npm audit --omit=dev`: **0 açık** (çalışma sırasındaki registry sonuçları).
- Görsel çıktılar: `test-results/admin-desktop.png`, `test-results/admin-mobile.png` (gitignore kapsamındadır).

## Production migration ve aday süreç — çalıştırılmadı

Bu örnek Linux/PM2/Nginx topolojisi içindir. `RELEASE`, origin ve mevcut PM2 adı gerçek sunucuya uyarlanmalıdır. Domain/path/PM2 konfigürasyonu bu çalışma sırasında doğrulanmadı. Kalıcı DB ve uploads **release dizini ve dist dışında** olmalıdır. Mevcut DB'yi boş bir yeni DB ile değiştirmeyin; gerçek DB'nin mutlak yolunu kullanın.

```bash
set -euo pipefail
export RELEASE=/srv/yallagame/releases/ADMIN_RELEASE
export NODE_ENV=production
export DB_PATH=/var/lib/yallagame/rooms.db
export UPLOAD_DIR=/var/lib/yallagame/uploads
export BACKUP_DIR=/var/backups/yallagame
export ALLOWED_ORIGIN=https://YOUR_REAL_GAME_DOMAIN
export TRUST_PROXY=loopback
export ANALYTICS_RETENTION_DAYS=365
cd "$RELEASE"
node --version
npm ci --include=dev
npm run typecheck
npm run lint
npm test -- --coverage
npm run test:e2e
npm run test:build-persistence
npm audit --omit=dev
# build zaten E2E/kalıcılık testi içinde çalıştı; final modülleri ayrıca doğrula:
node scripts/verify-server-build.mjs
node scripts/smoke-production.mjs

# CLI migrate, mevcut DB için önce online backup + integrity_check yapar.
node dist/server/control/cli.js migrate
node dist/server/control/cli.js create operator
# Daha önce oluşturulmuş hesap için create yerine gerektiğinde:
# node dist/server/control/cli.js password operator

# Eski PM2 uygulamasına dokunmadan ayrı portta tek fork aday süreç:
PORT=3001 pm2 start dist/server/index.js --name yallagame-admin-candidate --cwd "$RELEASE"
node scripts/health-gate.mjs http://127.0.0.1:3001/health
```

Bu son komut hata verirse **mevcut PM2 process ve Nginx upstream aynen kalır**; yalnızca aday süreç incelemeye alınır. Health endpoint hassas yol/sürüm/veri döndürmez: `{ "ok": true/false }` ve 200/503 verir.

Public traffic için HTTPS zorunludur. Reverse proxy WebSocket upgrade header'larını taşımayı sürdürmeli; `/admin`, `/api/admin`, `/api/auth` cache'lenmemelidir. Upload limiti proxy'de en az 5 MiB olmalıdır. `TRUST_PROXY` yalnızca gerçekten güvenilen proxy adresini kapsamalı; dışarıdan gelen X-Forwarded-For'a sınırsız güvenilmemelidir.

## Trafik geçişi ve rollback şablonu — çalıştırılmadı

Mevcut Socket.IO server tek instance olduğu için iki sürümü aynı anda load-balance etmeyin. Mümkünse aktif oda olmayan bakım aralığı seçin. Aday health kontrolünden **sonra** mevcut Nginx upstream dosyasının yedeğini alıp doğrulanmış 3001 upstream'ini atomik etkinleştirin. Mevcut sunucunun konfigürasyon yolu ve servis adı bilinmediği için örnekte değişkenle verildi:

```bash
export OLD_PM2_NAME=yallagame
export UPSTREAM_FILE=/etc/nginx/conf.d/yallagame-upstream.conf
# Bu dosyanın yalnızca 'upstream yallagame_backend' bloğunu içerdiği önceden doğrulanmalıdır.
export UPSTREAM_BACKUP="$BACKUP_DIR/nginx-upstream-$(date +%Y%m%d%H%M%S).conf"
node scripts/health-gate.mjs http://127.0.0.1:3001/health
sudo cp --preserve=mode,ownership "$UPSTREAM_FILE" "$UPSTREAM_BACKUP"
printf 'upstream yallagame_backend { server 127.0.0.1:3001; }\n' | sudo tee "$UPSTREAM_FILE.next" >/dev/null
sudo mv "$UPSTREAM_FILE.next" "$UPSTREAM_FILE"
if ! sudo nginx -t; then
  sudo cp "$UPSTREAM_BACKUP" "$UPSTREAM_FILE"
  exit 1
fi
# Yalnızca candidate health ve nginx config testinden sonra eski süreci durdur.
# Önce eski socket'leri kapatmak, iki process arasında oda mesajlarının bölünmesini önler.
pm2 stop "$OLD_PM2_NAME"
if ! sudo systemctl reload nginx; then
  sudo cp "$UPSTREAM_BACKUP" "$UPSTREAM_FILE"
  sudo nginx -t
  pm2 restart "$OLD_PM2_NAME"
  sudo systemctl reload nginx
  exit 1
fi
curl --fail --silent --show-error "$ALLOWED_ORIGIN/health"
pm2 save
```

Bu kısa geçişte client'lar reconnect edebilir; room DB korunur. Normal kesintisiz yatay ölçekleme için Socket.IO adapter ve koordineli timer sahipliği ayrıca tasarlanmalıdır. Eski sürüm/release/PM2 kaydı hemen silinmez.

Uygulama rollback'i için (yeni tablolar eklemeli olduğundan normal rollback'te DB restore yapılmaz):

```bash
# Eski PM2 kaydı ve release hâlâ duruyor olmalı; port 3000 örnektir.
pm2 restart "$OLD_PM2_NAME"
curl --fail --silent --show-error http://127.0.0.1:3000/healthz
sudo cp "$UPSTREAM_BACKUP" "$UPSTREAM_FILE"
sudo nginx -t
pm2 stop yallagame-admin-candidate
sudo systemctl reload nginx
pm2 save
```

Eski sürümün `/healthz` endpoint'i başarılı olmadan proxy veya yeni süreç değiştirilmez. Eski kod admin override'larını kullanmaz, ancak yeni tabloların kalması mevcut oda verisini silmez. Upload dizinini ve yeni DB tablolarını rollback sırasında kaldırmayın.

Yalnızca DB hasarı varsa offline restore gerekir: bütün DB writer process'lerini durdurun, mevcut DB/WAL/SHM'yi ayrı kurtarma dizininde arşivleyin, CLI'nin doğruladığı backup DB'yi gerçek DB yoluna kopyalayın, sahiplik/0600 izinlerini düzeltin ve health kontrolüyle başlatın. **Backup sonrasındaki odalar/ayarlar/analytics kaybolur**; çalışan DB'nin üzerine dosya kopyalamayın ve eski WAL/SHM dosyalarını yeni backup ile karıştırmayın. Normal kod rollback'inde buna gerek yoktur.
