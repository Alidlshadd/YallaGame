# YallaGame güvenlik incelemesi

İnceleme: 25–27 Eylül 2026. Kapsam, bu depodaki uygulama kodu, npm bağımlılıkları ve izole yerel test sunucularıdır. Canlı sunucuya dağıtım, işletim sistemi/SSH/firewall taraması veya dış ağdan penetrasyon testi yapılmadı. Bulguların düzeltilmesi tüm olası açıkların bulunmuş olduğu anlamına gelmez.

## Düzeltilen bulgular

| Bulgu | Etki | Düzeltme |
|---|---|---|
| Herkese gönderilen oyuncu ID'si yeniden bağlanma kimlik bilgisi olarak kabul ediliyordu. | Başka oyuncunun koltuğuna geçme, gizli rolünü öğrenme ve onun adına hamle yapma. | Oda sırrı ve oyuncu ID'sine bağlı HMAC-SHA256 `resumeToken`; sabit süreli karşılaştırma. Anahtar yalnızca ilgili oyuncuya gönderilir. Bekleyen katılımlar da aynı korumayı kullanır. |
| Bağlantısı kopmuş oyuncunun adı, kimlik doğrulamadan koltuğunu geri alabiliyordu. | İsimle oyuncu/ev sahibi koltuğunu ele geçirme; onay mekanizmasını atlama. | Mevcut isimler bağlantı durumundan bağımsız olarak ayrılmıştır. Yeniden bağlanma özel anahtar gerektirir. Silinmiş/atılmış koltuğun eski anahtarı reddedilir. |
| Bluff Trivia seçeneklerinde `opt-correct`, `opt-lie-*`, `opt-decoy-*` kimlikleri ve genel bilgilerden hesaplanan sıralama vardı. | Doğru cevap tarayıcı trafiğinden anlaşılabiliyordu. | Bütün seçeneklere aynı biçimde rastgele, anlamsız kimlikler; kriptografik rastgele karıştırma. Sıralama odada saklanır ve bütün oyunculara aynı gösterilir. |
| Oda/kimlik değiştiren bağlantı eski özel kanallarda kalabiliyordu; kapanan veya süresi dolan odaların abonelikleri temizlenmiyordu. | Önceki koltuktan veri almaya devam etme; oda kodu tekrar kullanıldığında rol sızıntısı riski. | Tek aktif kimlik, eski aboneliklerin temizlenmesi, kapanış ve kod yeniden kullanımında iptal. Hamlelerde etkin özel kanal üyeliği de kontrol edilir. |
| Katılım onay kuyruğu sınırsızdı; eşzamanlı oluşturma istekleri toplam oda sınırını aşabiliyordu. | Bellek/veritabanı tüketimi ve kapasite sınırlarının aşılması. | Oyuncular ve bekleyenler aynı kapasiteyi paylaşır; toplu kabul sınırı korur. Oda sayımı ve oluşturma aynı kilit içinde yürütülür. |
| WebSocket el sıkışmasında kaynak doğrulanmıyor, sınırlar yalnızca soket bazında uygulanıyordu. | Başka sitelerden bağlantı kurulması ve yeniden bağlanarak istek sınırlarının aşılması. | El sıkışmasında tam Origin eşleşmesi; IP bazında ortak bağlantı/mesaj/oda sınırları ve 16 KiB mesaj boyutu sınırı. |
| Hız sınırına takılan her giriş denemesi ayrı denetim kaydı oluşturuyordu. | Giriş saldırısının kayıt dosyası/veritabanını büyütmesi. | IP başına 15 dakikada bir hız sınırı kaydı; ilk başarısız kimlik doğrulamalarının kayıtları korunur. |
| MemoryStore'da reddedilen işlem aynı odada sıradaki geçerli işlemi de reddedebiliyordu. | Hatalı/yetkisiz isteğin başka oyuncunun geçerli işlemini bozması. | İşlem kuyruğu önceki reddedilmeden sonra devam eder; iki depolama uygulaması için regresyon testi eklendi. |

Ek olarak üretim Origin ayarı doğrulanır; genel HTTP adresleri, joker değerler, kullanıcı bilgisi içeren adresler ve yol/son eğik çizgi içeren değerler kabul edilmez. Yerel üretim testleri için açıkça verilen HTTP loopback adresleri ve izole `:memory:` test sunucuları istisnadır. `resumeToken` günlüklerden maskelenir.

## İncelenen diğer alanlar

- Yönetici oturumu, scrypt parola saklama, giriş sınırları, CSRF, Secure/HttpOnly/SameSite çerezleri ve oturum iptali.
- Yönetici API erişimi, SQL sorgularında parametre kullanımı, istemci metin oluşturma ve HTML kaçışları.
- Görsel yüklemelerinde kimlik doğrulama, boyut/piksel/format sınırı, yeniden kodlama ve dosya yolu doğrulaması.
- Rol/oyun görünümü filtreleme, hamle yetkilendirmesi, public-config ve servis çalışanı önbelleği.
- Kaynak dosyalarında yaygın özel anahtar/token biçimleri için sınırlı tarama; eşleşme bulunmadı. Bu, kapsamlı geçmiş/gizli bilgi taraması değildir.
- `npm audit --json`: 524 bağımlılık kaydında bilinen açık sayısı **0**. Bu sonuç sorgulama zamanındaki kayıtları kapsar.

WebSocket kaynak doğrulaması, mesaj yetkilendirmesi, boyut ve hız sınırları için [OWASP WebSocket Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html) esas alındı. Origin kontrolü tarayıcıları sınırlar; özel istemciler Origin başlığını taklit edebildiğinden kimlik doğrulamanın yerine geçmez.

## SQL injection ve ek HTTP korumaları

Proje MySQL değil SQLite kullanır. İncelenen sorgular hazırlanmış ifadeler ve bağlı parametreler kullanır; dinamik sütun/sıralama parçaları sunucunun sabit seçeneklerinden gelir. Bu turda SQL injection açığı tespit edilmedi. Giriş, oyuncu/geçmiş/denetim aramaları ve filtrelere SQL parçaları gönderilen regresyon testleri, kimlik doğrulamanın atlanamadığını, tabloların değişmediğini ve arama jokerlerinin düz metin olarak işlendiğini doğrular. Yaklaşım [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) önerileriyle uyumludur.

Eklenen korumalar:

- Veritabanı, yedek ve yükleme yolları `public` veya `dist` altında olamaz. Mevcut sembolik bağlar/junction hedefleri de kontrol edilir; iki veritabanı giriş noktası dosyayı açmadan önce reddeder.
- HTTPS üretimde HSTS ve güvensiz isteklerin HTTPS'e yükseltilmesi; CSP içinde tam WebSocket origin sınırı, inline script/iframe/base etiketi kısıtları; referrer ve tarayıcı izin başlıkları. Ekranı açık tutma izni uygulama için korunur.
- Katalog ve public-config uçlarında IP başına ortak 600 istek/dakika sınırı; 16 KiB HTTP başlık sınırı, 15 saniye başlık ve 30 saniye istek zaman aşımı.
- Sıkıştırılmış istek gövdeleri reddedilir. Yanıt sıkıştırması korunur. Beklenmeyen HTTP hatalarında SQL, dosya yolu ve stack trace yerine genel yanıt gönderilir.
- Bütün yönetici değişikliklerinde CSRF, yetkisiz yükleme, hatalı/aşırı büyük JSON, sıkıştırılmış istekler, tehlikeli görsel URL'leri ve beklenmeyen nesne alanları için olumsuz testler.

## Doğrulama

- `npm run typecheck` ve `npm run lint`: başarılı.
- `npm test -- --coverage`: **31 dosya, 429 test başarılı**. Yapılandırılmış `domain` ve `store` kapsamı: satırlar %99,65, dallar %87,44; CI eşikleri geçti. Bu yüzdeler tüm uygulamayı kapsamaz.
- Güvenlik regresyonları gerçek Socket.IO bağlantılarında kimlik taklidi, gizli anahtar kullanımı, onay, üyelik iptali, oda kodu tekrar kullanımı, eşzamanlı kapasite sınırı, kötü kaynak ve aşırı büyük paketleri sınar.
- Üretim derlemesi ve izole başlangıç/sağlık/korumalı yönetici API smoke testi başarılı.
- Ek HTTP/SQL korumalarından sonra seçilen **6 tarayıcı testi tekrar başarılı**: yönetici erişimi/çıkış, yükleme/ayarlar, servis çalışanı önbelleği, güvenli metin/dil değişimi, hata yanıtları ve oyuncu yeniden bağlanması. Bilinen görsel kontrast testi bu turda kapsam dışında bırakıldı.
- Seçilen 24 tarayıcı senaryosunun **23'ü başarılı**: oda listesi/katılım/onay/ret/kapatma, yeniden bağlanma, ağ paketlerinde rol gizliliği, Bluff Trivia, yönetici giriş/çıkış, yükleme/ayar işlemleri, önbellek ayrımı, dil değişiminde güvenli metin ve sunucu hataları. İlk turdaki beş tarayıcılı senaryonun 30 saniyelik zaman aşımı, 60 saniyelik sınırla başarılı; uygulama davranışı aynı kaldı.
- Bir mevcut görsel test hâlâ başarısız: `control-center.spec.ts` içindeki bütün dil/tema rotalarını gezen test, `--accent` / `--accent-soft` için 1 kontrast oranı hesaplıyor. Testin yardımcı fonksiyonu sekiz haneli hex rengin alfa kanalını arka planla birleştirmiyor. Bu test güvenlik testi değildir; tüm E2E paketinin temiz geçtiği iddia edilmez. Aynı testin eski sekiz menü bağlantısı beklentisi, mevcut Avatar menüsü dahil dokuz bağlantıyı doğrulayacak şekilde güncellendi.
- `npm run test:build-persistence`: başarılı. Üretim yeniden derlemesi sonrasında geçici SQLite ayarı, görsel dosyası, public-config ve dosya sunumu korundu. Bu komut üretim build/smoke kontrolünü de tekrar geçti.

## Dağıtım koşulları

Bu değişiklikler çalışma ağacındadır; canlı sunucuya uygulanmadı. Yayın sırasında eski oyuncu oturumları için yeni odalar açılmalıdır; eski oturumlara yalnızca ID/isim üzerinden güvenli geçiş yapılamaz. Eski Bluff Trivia turları da eski seçenek kimliklerini sakladığından yeniden başlatılmalıdır.

Kalıcı üretim için gerçek `https://...` Origin değerini, mutlak veri/yükleme yollarını ve dar kapsamlı `TRUST_PROXY` ayarını kullanın. Ters vekilin HTTPS, WebSocket upgrade, önbellek ve istek sınırları ayrıca canlı ortamda doğrulanmalıdır.

IP sınırları aynı NAT arkasındaki kullanıcılar arasında paylaşılır. Süreç yeniden başlatıldığında sıfırlanırlar; dağıtık DDoS koruması veya birden fazla sunucu arasında paylaşılan sınır değildirler. Bu proje bağımsız Socket.IO süreçleri arasında yük dengeleme için tasarlanmamıştır.
