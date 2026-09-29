# Oyun sonu değerlendirmesi

- Online oyunlar tamamlandığında katılımcılara 1–5 yıldız ve isteğe bağlı yorum alanı gösterilir. Vampir yöneticisi katılımcı sayılmaz.
- Sonucu masada belirlenen rol oyunlarında yönetici **Oyunu Bitir** düğmesine basar. Rol temizlemek veya ayar değiştirmek değerlendirme açmaz.
- Aynı tarayıcıda her oyun için yalnızca bir kez sorulur; X, Escape veya geri tuşuyla kapatmak da soruyu tamamlar. Sayfa yenilemek ve başka odaya katılmak bu bilgiyi sıfırlamaz. Tarayıcı verileri silinirse ya da başka cihaz kullanılırsa soru yeniden görünebilir.
- Tek cihazda oynanan oyunlarda değerlendirme ortak tarayıcı içindir; her oyuncunun ayrı değerlendirme yapması için online modda kendi cihazını kullanması gerekir.
- Yorum zorunlu değildir. Kayıt başarılı olunca teşekkür animasyonu gösterilir; hata durumunda metin korunur ve yeniden gönderilebilir.
- Kayıtlar `/admin/feedback` altındaki **Oyuncu değerlendirmeleri** sayfasında bulunur. Liste herkese açık değildir.

## Kurulum

`game_feedback` tablosu mevcut, tekrar çalıştırılabilir admin migration'ına dahildir. Kalıcı production veritabanında yeni sürümü başlatmadan önce, doğru `DB_PATH` ile derlenmiş sürümden `node dist/server/control/cli.js migrate` çalıştırılmalıdır. CLI önce mevcut veritabanını yedekler. Geliştirme ve izole test veritabanları tabloyu açılışta oluşturur.

Kayıtlar SQLite'da saklanır; anonim ziyaretçi ve oyun başına tek kayıt tutulur. Bu oturumda production deployment veya production migration yapılmadı.
