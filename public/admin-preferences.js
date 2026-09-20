// Blocking, same-origin bootstrap: applies persisted preferences before the first paint.
// No session, credentials, or public-interface preferences are stored here.
;(function () {
  var theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  var language = "en"
  try {
    var savedTheme = localStorage.getItem("yalla-admin-theme")
    if (savedTheme === "light" || savedTheme === "dark") theme = savedTheme
    var savedLanguage = localStorage.getItem("yalla-admin-language")
    if (["en", "tr", "ar", "ku"].includes(savedLanguage)) language = savedLanguage
  } catch (_) {
    /* Use system theme when storage is unavailable. */
  }
  document.documentElement.dataset.theme = theme
  document.documentElement.lang = language
  document.documentElement.dir = language === "ar" || language === "ku" ? "rtl" : "ltr"
})()
