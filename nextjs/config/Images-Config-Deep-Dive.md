# images — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/images
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. images Config Là Gì?

```
  images — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Custom config cho next/image loader! ★★★                │
  │  → Dùng cloud provider thay built-in Image Optimization! ★ │
  │  → loader + loaderFile trong images config! ★               │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    images: {                                           │    │
  │  │      loader: 'custom',            ★★★                 │    │
  │  │      loaderFile: './my/loader.js' ★★★                 │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LOADER FUNCTION:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  'use client'                                          │    │
  │  │  export default function myLoader({ src, width,        │    │
  │  │    quality }) {                                        │    │
  │  │    return `https://cdn.com/${src}?w=${width}           │    │
  │  │            &q=${quality || 75}`                        │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  Params:                                               │    │
  │  │  → src:     image source path! ★                      │    │
  │  │  → width:   requested width (px)! ★                   │    │
  │  │  → quality: 1-100 (default 75)! ★                     │    │
  │  │  Return:    URL string! ★★★                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  <Image src="/photo.jpg" width={800} />               │    │
  │  │       ↓                                                │    │
  │  │  loader({ src: '/photo.jpg', width: 800, quality: 75})│    │
  │  │       ↓                                                │    │
  │  │  'https://cdn.com/photo.jpg?w=800&q=75' ★★★          │    │
  │  │       ↓                                                │    │
  │  │  <img src="https://cdn.com/photo.jpg?w=800&q=75" />  │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ Client Component required! (serialize function) ★★★      │
  │  → Hoặc dùng loader prop trên mỗi <Image /> ★             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Cloud Provider Loaders — 16 Providers!

```
  PROVIDERS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌───────────────┬──────────────────────────────────────┐    │
  │  │ Provider        │ URL Pattern                          │    │
  │  ├───────────────┼──────────────────────────────────────┤    │
  │  │ Akamai          │ ?imwidth=${width}                    │    │
  │  │ AWS CloudFront  │ ?format=auto&width=&quality=         │    │
  │  │ Cloudinary      │ /f_auto,c_limit,w_${w},q_${q}/     │    │
  │  │ Cloudflare      │ /cdn-cgi/image/width=,quality=/     │    │
  │  │ Contentful      │ ?fm=webp&w=&q=                       │    │
  │  │ Fastly          │ ?auto=webp&width=&quality=           │    │
  │  │ Gumlet          │ ?w=&q=                                │    │
  │  │ ImageEngine     │ /w_${w}/cmpr_${q}/                   │    │
  │  │ Imgix           │ ?auto=format&fit=max&w=&q=           │    │
  │  │ PixelBin        │ /t.resize(w:)/t.compress(q:)/       │    │
  │  │ Sanity          │ ?auto=format&fit=max&w=&q=           │    │
  │  │ Sirv            │ ?w=&q=                                │    │
  │  │ Supabase        │ /render/image?width=&quality=        │    │
  │  │ Thumbor         │ /${width}x0/smart/${src}             │    │
  │  │ ImageKit.io     │ ?tr=w-${w},q-${q}                    │    │
  │  │ Nitrogen AIO    │ ?w=&q=                                │    │
  │  └───────────────┴──────────────────────────────────────┘    │
  │                                                              │
  │  → Tất cả nhận { src, width, quality }! ★                  │
  │  → Return URL string! ★★★                                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — ImageLoaderEngine!

```javascript
var ImageLoaderEngine = (function () {
  // ═══════════════════════════════════
  // 1. BUILT-IN LOADERS
  // ═══════════════════════════════════
  var loaders = {
    cloudinary: function (opts) {
      var params = [
        "f_auto",
        "c_limit",
        "w_" + opts.width,
        "q_" + (opts.quality || "auto"),
      ];
      return (
        "https://res.cloudinary.com/demo/image/upload/" +
        params.join(",") +
        opts.src
      );
    },
    cloudflare: function (opts) {
      var params = [
        "width=" + opts.width,
        "quality=" + (opts.quality || 75),
        "format=auto",
      ];
      return (
        "https://example.com/cdn-cgi/image/" + params.join(",") + "/" + opts.src
      );
    },
    imgix: function (opts) {
      return (
        "https://example.com" +
        opts.src +
        "?auto=format&fit=max&w=" +
        opts.width +
        "&q=" +
        (opts.quality || 75)
      );
    },
    akamai: function (opts) {
      return "https://example.com" + opts.src + "?imwidth=" + opts.width;
    },
  };

  // ═══════════════════════════════════
  // 2. CUSTOM LOADER FACTORY
  // ═══════════════════════════════════
  function createLoader(baseUrl, paramFormat) {
    return function (opts) {
      var url = baseUrl + opts.src;
      var sep = url.indexOf("?") >= 0 ? "&" : "?";
      url += sep + "w=" + opts.width + "&q=" + (opts.quality || 75);
      return url;
    };
  }

  // ═══════════════════════════════════
  // 3. IMAGE TAG GENERATOR
  // ═══════════════════════════════════
  function generateImgTag(loader, src, width, quality) {
    var url = loader({ src: src, width: width, quality: quality });
    return {
      tag: '<img src="' + url + '" width="' + width + '" />',
      url: url,
      srcSet: [1, 2]
        .map(function (dpr) {
          return (
            loader({ src: src, width: width * dpr, quality: quality }) +
            " " +
            dpr +
            "x"
          );
        })
        .join(", "),
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ ImageLoader Engine ═══");

    console.log("\n── 1. Built-in Loaders ──");
    var opts = { src: "/photo.jpg", width: 800, quality: 80 };
    for (var name in loaders) {
      console.log(name + ":", loaders[name](opts));
    }

    console.log("\n── 2. Custom Loader ──");
    var myLoader = createLoader("https://mycdn.com", "w,q");
    console.log("Custom:", myLoader(opts));

    console.log("\n── 3. Image Tag ──");
    console.log(generateImgTag(loaders.cloudinary, "/photo.jpg", 400, 75));
  }

  return { demo: demo };
})();
// Chạy: ImageLoaderEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: images config dùng làm gì?                              │
  │  → Custom image loader cho next/image! ★★★                 │
  │  → Dùng cloud provider thay built-in optimization! ★       │
  │  → loader: 'custom' + loaderFile! ★                        │
  │                                                              │
  │  ❓ 2: Loader function nhận gì, trả gì?                       │
  │  → Nhận: { src, width, quality }! ★                        │
  │  → Trả: URL string! ★★★                                    │
  │  → quality default = 75! ★                                 │
  │                                                              │
  │  ❓ 3: Tại sao cần 'use client'?                               │
  │  → Loader là function → phải serialize! ★★★               │
  │  → Client Components cho phép serialize! ★                 │
  │  → Hoặc dùng loader prop trên mỗi <Image />! ★           │
  │                                                              │
  │  ❓ 4: Kể vài cloud providers?                                │
  │  → Cloudinary, Cloudflare, Imgix, Akamai, AWS              │
  │    CloudFront, Fastly, Supabase, ImageKit...! ★★★         │
  │  → 16 providers có sẵn example! ★                         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
