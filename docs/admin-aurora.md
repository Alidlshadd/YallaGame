# Aurora Game Command Center

20 Eylül 2026. `/admin` arayüzü, mevcut Express/SQLite API sözleşmeleri korunarak yeniden tasarlandı.

## Uygulama

- Overview, analytics, history, players, library, branding, system, audit, login ve logout aynı admin tasarım sistemini kullanır.
- Lacivert/indigo dark tema ve lavanta light tema CSS tokenlarıyla tanımlıdır. Tema ilk çizimden önce aynı origin'deki küçük bir bootstrap scriptiyle uygulanır. İlk tercih işletim sisteminden alınır; açık seçim `yalla-admin-theme` altında saklanır.
- Merkezi TypeScript sözlüğü English, Türkçe, العربية ve Sorani کوردی içerir. Seçim `yalla-admin-language` altında saklanır. Dil değişimi mevcut metin düğümlerini ve erişilebilir isimleri günceller; form, seçili filtre ve blob önizlemesi yeniden oluşturulmaz. `ar`/`ku` RTL, `en`/`tr` LTR kullanır.
- Marka adı, tema logosu ve sayfa başlığı public branding yapılandırmasından gelir. Boş yapılandırmada mevcut paketlenmiş marka kullanılır. Branding sayfasında iki temalı canlı önizleme vardır; kaydetmeden public ayarlar değişmez.
- Dashboard 10 mevcut KPI'yı, dört grafiği ve mevcut system endpoint'inden çalışma bilgisini gösterir. Başarı/online göstergeleri gerçek yanıtı kullanır. Tarih aralığı, UTC açıklaması ve son güncelleme görünürdür. Sayılar yalnızca değer değişiminde kısa süreli animasyon kullanır.
- Lucide SVG ikonları, aurora yüzeyleri, kart/bar girişleri, hover ışığı, native dialog geçişleri, toast animasyonu ve skeleton durumları kullanılır. Destekleyen tarayıcılarda native dil seçicisi ve sayfa geçişleri de animasyonludur. `prefers-reduced-motion` dekoratif animasyonları kapatır.
- Tablo başlıkları scroll alanında sabittir. Filtre/pagination/UTC davranışı korunur. Audit metadata'sı açılır detayda güvenli metin olarak gösterilir.
- Görsel düzenleyicileri seçim/sürükleme, önizleme, kaydedilmemiş, yüklenmiş ve varsayılan durumlarını ayırır. Upload sırasında gerçek bekleme durumu gösterilir; uydurma yüzde gösterilmez. Save esnasında form etkileşimi kilitlenir. Disable/reset/branding onayları korunur.
- Klavye odağı modal ve mobil drawer içinde döner; kapanınca çağıran kontrole geri gelir. Skip link, görünür focus, form doğrulaması, `aria-busy`, toast/loading bildirimleri ve açıklayıcı kontrol isimleri vardır.

Backend, cookie, session, CSRF/origin, rate limit, upload doğrulama, analytics sorguları, audit yazımı, SQLite veya public oyun uygulaması bu değişiklik kapsamında değiştirilmedi. Yeni UI framework, CDN scripti veya runtime dependency eklenmedi. Kullanıcı verileri ve çeviriler HTML olarak yorumlanmaz; teknik backend hataları yerelleştirilmiş güvenli mesajlara dönüştürülür. Admin sayfaları için mevcut service-worker cache dışlama davranışı korunur.

## Dosyalar

- `control.html`
- `public/admin-preferences.js`
- `src/client/control/main.ts`
- `src/client/control/style.css`
- `src/client/control/i18n.ts`
- `src/client/control/ui.ts`
- `tests/e2e/control-center.spec.ts`
- `tests/unit/control/admin-i18n.test.ts`
- `docs/admin-aurora.md`

## Doğrulama kapsamı

Admin E2E kendi geçici SQLite veritabanını, geçici upload dizinini ve rastgele test parolasını kullanır. Dashboard yanıtları taklit edilmez: ziyaret endpoint'i ve gerçek Socket.IO oda/katılma/rol dağıtma/kapatma akışlarıyla test aktivitesi oluşturulur. Yalnızca güvenli hata fallback testi, kasıtlı bir HTTP 500 yanıtı kullanır.

- Dört dil × iki tema × dokuz oturumlu rota; ayrıca sekiz login görünümü.
- İngilizce/Türkçe LTR, Arapça/Kürtçe RTL; oyun isimleri katalogdaki seçili dil değerleriyle karşılaştırılır.
- Dil ve tema kalıcılığı, canlı dil değişiminde aynı document/form/önizleme korunması.
- 1440 px desktop, 768 px tablet, 390/320 px mobil viewport kontrolleri; drawer yönü, Escape ve focus restore.
- Tema tokenlarının temel metin/zemin çiftlerinde en az 4.5:1 kontrast.
- İşletim sistemi teması, reduced motion, parola görünürlüğü ve parolanın storage'a yazılmaması.
- Login/logout, session reddi, CSRF kullanan save/upload/reset, disabled oyunun Socket.IO reddi, gerçek public branding ve service-worker cache sınırı.
- Metin ve tarih filtreleri, UTC kayıtlar, dolu/boş tablolar, audit detayları, yerelleştirilmiş hata/validation/toast mesajları.
- Sözlükte dört çevirinin varlığı, interpolation alanlarının eşleşmesi, metin/ARIA güncellemesi ve HTML injection'ın önlenmesi için birim testleri.

Ekran görüntüleri test çıktısıdır ve commit'e dahil edilmez: `test-results/aurora-{en,tr,ar,ku}-{dark,light}.png`, `aurora-login-*`, `aurora-brand-*`, `aurora-mobile-*`.

## Test sonuçları ve sınırlar

| Kontrol                                                | Sonuç                                                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `npm run typecheck`                                    | Geçti                                                                                                        |
| `npm run lint`                                         | Geçti                                                                                                        |
| `npm test`                                             | 25 dosya, 373 test geçti                                                                                     |
| `npm run build`                                        | Geçti; derlenmiş server import kontrolü, Vite ve production smoke dahil (E2E sunucu hazırlığında da çalışır) |
| `npm run test:e2e`                                     | İzole kopyada 68/68 geçti; public oyun ve admin senaryoları birlikte                                         |
| `npm run test:e2e -- tests/e2e/control-center.spec.ts` | Son genişletilmiş turda 6/6 geçti; 320/768 px ek kontrolleri dahil                                           |

Test ortamı Chromium/Playwright ve emüle edilmiş mobil viewport kullanır; fiziksel mobil cihaz, Firefox/Safari ve ekran okuyucuyla manuel sertifikasyon yapılmamıştır. Animasyonlar compositor dostu özellikleri önceler; tüm cihazlarda ölçülmüş 60 FPS garantisi verilmez.

Çalışma sırasında public ana sayfa/yönlendirme dosyalarında ayrı değişiklikler sürdüğü için admin değişiklikleri ayrıca `6b4a0f2` tabanının geçici bir kopyasında test edildi. Bu kopyaya yalnızca yukarıdaki admin kodu ve testleri aktarıldı. Ortak çalışma ağacındaki ilk tam E2E turunda public `back-navigation` testi, ana sayfadan taşınmış `.shelf-card.game-card` öğesini bulamadı; admin senaryoları geçtikten sonra bu tur durdurulup tam paket izole kopyada tamamlandı. Public değişiklikler silinmedi veya admin commit'ine alınmadı. Deploy ve production migration çalıştırılmadı.
