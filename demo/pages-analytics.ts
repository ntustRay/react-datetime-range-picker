(() => {
  const path = "/react-datetime-range-picker/";
  const origin = "https://ntustray.github.io";
  const measurementId = "G-Z6KZJDZFS6";
  const { search, hash, pathname } = location;
  if (
    location.origin !== origin ||
    pathname !== path ||
    search ||
    hash ||
    navigator.doNotTrack === "1" ||
    ("globalPrivacyControl" in navigator &&
      navigator.globalPrivacyControl === true) ||
    document.getElementById("site-analytics-tag")
  ) {
    return;
  }

  const page = { page_location: origin + path, page_referrer: "" };
  const dataLayer: IArguments[] = [];
  Object.assign(window, { dataLayer });
  const gtag: (...parameters: unknown[]) => void = function () {
    // Google Tag consumes an Arguments entry rather than a plain array.
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  };

  gtag("js", new Date());
  gtag("config", measurementId, {
    ...page,
    send_page_view: false,
    cookie_path: path,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  gtag("event", "page_view", { ...page, send_to: measurementId });

  const script = document.createElement("script");
  script.id = "site-analytics-tag";
  script.async = true;
  script.referrerPolicy = "no-referrer";
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
  document.head.append(script);
})();
