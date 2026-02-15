# Web Security: XSS, CSRF & Clickjacking — Deep Dive

> 📅 2026-02-12 · ⏱ 20 phút đọc
>
> Essential web security knowledge for front-end interviews
> 3 major attacks: XSS (3 types) → CSRF → Clickjacking
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Security Interview Must-Know

---

## Mục Lục

| #   | Section                             |
| --- | ----------------------------------- |
| 1   | Overview — 3 Front-End Attack Types |
| 2   | XSS: Reflected (Non-Persistent)     |
| 3   | XSS: DOM-Based                      |
| 4   | XSS: Stored (Persistent)            |
| 5   | XSS Defense — 6 Strategies          |
| 6   | XSS Detection                       |
| 7   | CSRF: Cross-Site Request Forgery    |
| 8   | CSRF Defense — 4 Strategies         |
| 9   | Clickjacking                        |
| 10  | Clickjacking Defense                |
| 11  | Security Scanning Tools             |
| 12  | Summary & Interview Checklist       |

---

## §1. Overview — 3 Front-End Attack Types

```
3 MAIN FRONT-END ATTACKS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────────────────────────────────┐
  │ Attack           │ Core Idea                                │
  ├──────────────────┼──────────────────────────────────────────┤
  │ XSS              │ Inject MALICIOUS SCRIPT into target site │
  │ (Cross-Site      │ → Script runs in victim's browser        │
  │  Scripting)      │ → Steals data, hijacks sessions          │
  │                  │                                          │
  │ CSRF             │ Trick victim into sending REQUEST to     │
  │ (Cross-Site      │ target site FROM attacker's site         │
  │  Request Forgery)│ → Uses victim's existing cookies/session │
  │                  │                                          │
  │ Clickjacking     │ Hidden iframe overlays attractive page   │
  │                  │ → User clicks what they SEE              │
  │                  │ → Actually clicks HIDDEN iframe action   │
  └──────────────────┴──────────────────────────────────────────┘

  KEY DIFFERENCE:
  XSS  → attacker's CODE runs on target site
  CSRF → attacker's SITE sends requests to target site
  Click → attacker's PAGE tricks user into clicking target site
```

---

## §2. XSS: Reflected (Non-Persistent)

```
REFLECTED XSS — ATTACK FLOW:
═══════════════════════════════════════════════════════════════

  ① Attacker crafts malicious URL with script in query params:
     https://example.com/search?q=<script>alert(1)</script>

  ② Attacker tricks victim into CLICKING this URL
     (via email, social media, phishing page)

  ③ Server receives URL, extracts query param, inserts into HTML
     WITHOUT escaping, returns to browser

  ④ Browser renders response → executes malicious script!

  ⑤ Script steals cookies, session tokens → sends to attacker

  Attacker      Victim             Server
  ────────      ──────             ──────
     │                                │
     │── Sends malicious URL ──→│     │
     │                          │     │
     │                          │── Request with malicious param ──→│
     │                          │                                    │
     │                          │←── HTML with unescaped script ────│
     │                          │                                    │
     │                   Script executes!                            │
     │                   Steals cookies!                             │
     │←── Sends stolen data ────│                                   │
     │                          │                                    │

  COMMON TARGETS:
  → Search pages (query reflected in results)
  → Error pages (error message reflected)
  → Redirect pages (URL params reflected)

  NOTE: Chrome & Safari can detect URL-based XSS and BLOCK it!
  But Firefox CANNOT → still vulnerable!
```

```javascript
// ❌ VULNERABLE — query param directly in HTML
app.get("/search", (req, res) => {
  res.send(`<h1>Results for: ${req.query.q}</h1>`);
  // If q = <script>alert(document.cookie)</script>
  // → Script executes in browser!
});

// ✅ FIXED — escape query param before output
app.get("/search", (req, res) => {
  res.send(`<h1>Results for: ${encodeURIComponent(req.query.q)}</h1>`);
  // <script> becomes %3Cscript%3E → rendered as TEXT, not code!
});
```

---

## §3. XSS: DOM-Based

```
DOM-BASED XSS — ATTACK FLOW:
═══════════════════════════════════════════════════════════════

  ① Attacker crafts data containing malicious code
  ② Front-end JavaScript processes this data
  ③ Inserts it into DOM using DANGEROUS APIs
  ④ Malicious code executes!

  KEY DIFFERENCE from Reflected:
  → Reflected: server inserts malicious code into HTML response
  → DOM-based: FRONT-END JS inserts malicious code into DOM!
  → Server is never involved! Pure client-side vulnerability!

  DANGEROUS DOM APIs (can execute strings as code):
  ┌──────────────────────────────────────────────────────────┐
  │ element.innerHTML = userInput    ← DANGEROUS! 💀        │
  │ element.outerHTML = userInput    ← DANGEROUS! 💀        │
  │ document.write(userInput)        ← DANGEROUS! 💀        │
  │ element.insertAdjacentHTML()     ← DANGEROUS! 💀        │
  │ eval(userInput)                  ← MOST DANGEROUS! ☠️    │
  │ setTimeout(userInput)            ← if string arg         │
  │ setInterval(userInput)           ← if string arg         │
  └──────────────────────────────────────────────────────────┘

  SAFE ALTERNATIVES:
  ┌──────────────────────────────────────────────────────────┐
  │ element.textContent = userInput  ← SAFE! ✅             │
  │ element.innerText = userInput    ← SAFE! ✅             │
  │ element.setAttribute('attr', v) ← SAFE! ✅             │
  └──────────────────────────────────────────────────────────┘
```

```javascript
// ❌ VULNERABLE — innerHTML with user input
const userInput = "<img src=x onerror=alert(document.cookie)>";
document.getElementById("output").innerHTML = userInput;
// → onerror fires → alert executes!

// ✅ FIXED — use textContent instead
document.getElementById("output").textContent = userInput;
// → Rendered as plain text, no code execution!

// HTML encoding function for when you MUST use innerHTML:
function encodeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// URL encoding for src/href attributes:
element.src = encodeURIComponent(userInput);
```

---

## §4. XSS: Stored (Persistent)

```
STORED XSS — MOST DANGEROUS TYPE!
═══════════════════════════════════════════════════════════════

  ① Attacker submits malicious script to server (e.g., forum post)
  ② Server stores malicious code in DATABASE without filtering!
  ③ Any user visits the page → server retrieves malicious code
     from DB → inserts into HTML → returns to browser
  ④ Browser executes the malicious script!
  ⑤ Every visitor is affected! (not just one click target!)

  Attacker         Server DB              Victim
  ────────         ─────────              ──────
     │                  │                    │
     │── POST comment: ─┤                    │
     │   "<script>      │                    │
     │    steal(cookie)" │                    │
     │                  │  Stored in DB!     │
     │                  │                    │
     │                  │     Victim visits page
     │                  │←── GET /comments ──│
     │                  │                    │
     │                  │── HTML with script→│
     │                  │                    │
     │                  │    Script runs!    │
     │←── Stolen cookies ───────────────────│

  WHY IT'S THE WORST:
  → Persists in database → affects ALL visitors!
  → No need to trick individual users
  → Can spread like a WORM (self-replicating)

  COMMON TARGETS:
  → Forum posts, blog comments
  → User profiles, product reviews
  → Private messages, chat rooms
  → Any feature where users can SAVE content!

  3-LAYER DEFENSE NEEDED:
  ① Frontend → escape before sending to server
  ② Server → escape/filter before storing in DB
  ③ Frontend → escape before displaying server data
```

```
3 XSS TYPES — COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌───────────┬──────────────┬──────────────┬────────────────┐
  │           │ Reflected    │ DOM-based    │ Stored         │
  ├───────────┼──────────────┼──────────────┼────────────────┤
  │ Trigger   │ Click URL    │ Client JS    │ Visit page     │
  │ Storage   │ URL params   │ DOM only     │ Server DB!     │
  │ Server    │ Involved ✅  │ Not involved │ Involved ✅    │
  │ Reach     │ 1 victim     │ 1 victim     │ ALL visitors!  │
  │ Persist   │ No           │ No           │ YES (in DB!)   │
  │ Severity  │ Medium       │ Medium       │ HIGH! ☠️       │
  └───────────┴──────────────┴──────────────┴────────────────┘
```

---

## §5. XSS Defense — 6 Strategies

```
6 XSS DEFENSE STRATEGIES:
═══════════════════════════════════════════════════════════════

  ① INPUT ESCAPING / ENCODING
  → Escape < > " ' & before inserting into HTML
  → encodeURIComponent() for URL parameters
  → Use textContent instead of innerHTML

  ② CONTENT SECURITY POLICY (CSP) ⭐
  → HTTP header or <meta> tag
  → Controls what resources can load on page
  → Blocks inline scripts, external domains, etc.

  ③ INPUT LENGTH LIMIT
  → Shorter input = harder to inject complex scripts
  → Not a standalone defense, but raises difficulty

  ④ INPUT TYPE RESTRICTION
  → Allow only expected characters (numbers, letters)
  → Block special chars: < > " ' / ; ( )

  ⑤ HTTP-ONLY COOKIE
  → Cookie can't be read by JavaScript!
  → Even if XSS succeeds → can't steal HTTPOnly cookies!
  → Set-Cookie: token=abc123; HttpOnly

  ⑥ CAPTCHA FOR SENSITIVE OPERATIONS
  → Prevents scripts from impersonating user actions
  → Required for: transfers, password changes, etc.
```

```
CSP — CONTENT SECURITY POLICY (deep dive):
═══════════════════════════════════════════════════════════════

  Server header:
  Content-Security-Policy: default-src 'self'

  Or <meta> tag:
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'">

  WHAT CSP CAN DO:
  → ❌ Block loading external domain code
  → ❌ Block form submissions to external domains
  → ❌ Block inline script execution (<script>alert(1)</script>)
  → ❌ Block eval() and similar dynamic code
  → ✅ Report CSP violations to your server

  COMMON DIRECTIVES:
  ┌────────────────┬──────────────────────────────────────────┐
  │ default-src    │ Fallback for all resource types          │
  │ script-src     │ Where scripts can load from              │
  │ style-src      │ Where stylesheets can load from          │
  │ img-src        │ Where images can load from               │
  │ connect-src    │ Where fetch/XHR can connect to           │
  │ font-src       │ Where fonts can load from                │
  │ frame-src      │ Where iframes can load from              │
  │ form-action    │ Where forms can submit to                │
  └────────────────┴──────────────────────────────────────────┘

  EXAMPLE — strict config:
  Content-Security-Policy:
    default-src 'self';
    script-src 'self' 'nonce-abc123';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.example.com;
    frame-ancestors 'none';

  → 'nonce-abc123': only scripts with matching nonce execute
  → GitHub uses strict CSP with nonce-based script loading!
```

---

## §6. XSS Detection

```
HOW TO DETECT XSS VULNERABILITIES:
═══════════════════════════════════════════════════════════════

  ① MANUAL TESTING — Universal XSS Test String:

  jaVasCript:/*-/*`/*\`/*'/*"/**/(/* */oNcliCk=alert() )
  //%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt
  /--!>\x3csVg/<sVg/oNloAd=alert()//>\x3e

  → This single string tests XSS in:
    - HTML attributes
    - HTML text content
    - HTML comments
    - Jump links
    - Inline JavaScript strings
    - Inline CSS stylesheets
    - eval(), setTimeout(), setInterval()
    - innerHTML, document.write()

  ② SIMPLE IMAGE TEST:
  <img src=1 onerror=alert(1)>

  ③ AUTOMATED SCANNING TOOLS:
  → Arachni (Ruby-based, comprehensive)
  → OWASP ZAP (Java, free, extensive)
  → Burp Suite (professional, paid)
  → Mozilla Observatory (online, free)
```

---

## §7. CSRF: Cross-Site Request Forgery

```
CSRF — ATTACK FLOW:
═══════════════════════════════════════════════════════════════

  ① Victim logs into Bank.com → gets session cookie
  ② Victim visits Evil.com (attacker's site)
  ③ Evil.com sends a request to Bank.com:
     <img src="https://bank.com/transfer?to=attacker&amount=10000">
  ④ Browser AUTOMATICALLY attaches Bank.com's cookies!
     (cookies follow same-origin policy for the TARGET domain)
  ⑤ Bank.com receives request with valid session → thinks it's victim!
  ⑥ Transfer completes! Victim's money is stolen! 💸

  Victim          Evil.com          Bank.com
  ──────          ────────          ────────
     │                │                 │
     │── Visit ──────→│                 │
     │                │                 │
     │←─ Page with ───│                 │
     │   hidden form  │                 │
     │                │                 │
     │── Auto-submit form ────────────→│
     │   (with victim's cookies!)      │
     │                                  │
     │                     Bank thinks it's victim!
     │                     Executes transfer! 💸
     │                                  │
```

```
CSRF — 3 KEY CHARACTERISTICS:
═══════════════════════════════════════════════════════════════

  ① Attack launched from THIRD-PARTY site (not target site!)
  → Target site CANNOT prevent attacks from occurring

  ② Exploits victim's EXISTING LOGIN credentials
  → Does NOT steal cookies (cookies are same-origin!)
  → Just USES them by making browser attach them automatically

  ③ Multiple attack vectors:
  → <img src="...">          (GET request)
  → <form action="...">      (POST request, auto-submit)
  → <a href="...">           (link click)
  → CORS requests
  → Any cross-origin request that attaches cookies!

  XSS vs CSRF:
  ┌──────────┬─────────────────────┬─────────────────────────┐
  │          │ XSS                 │ CSRF                    │
  ├──────────┼─────────────────────┼─────────────────────────┤
  │ Attack   │ Inject code INTO    │ Send request FROM       │
  │ location │ target site         │ attacker's site         │
  │ Cookies  │ Can STEAL cookies   │ Can USE cookies (not    │
  │          │ (via JS)            │ steal — just ride along)│
  │ Defense  │ Escape/CSP          │ Token/SameSite          │
  └──────────┴─────────────────────┴─────────────────────────┘
```

```javascript
// CSRF attack examples:

// ① GET-based (simplest — just an image tag!)
// Evil.com page contains:
<img src="https://bank.com/transfer?to=attacker&amount=10000" />
// Browser loads image → sends GET with cookies → transfer happens!

// ② POST-based (hidden auto-submitting form)
<form action="https://bank.com/transfer" method="POST" id="hack">
    <input type="hidden" name="to" value="attacker" />
    <input type="hidden" name="amount" value="10000" />
</form>
<script>document.getElementById('hack').submit();</script>
// Form auto-submits on page load → POST with cookies!

// ③ Link-based (requires victim to click)
<a href="https://bank.com/transfer?to=attacker&amount=10000">
    Click here to win a prize! 🎁
</a>
```

---

## §8. CSRF Defense — 4 Strategies

```
4 CSRF DEFENSE STRATEGIES:
═══════════════════════════════════════════════════════════════

  ① CSRF TOKEN (Mainstream!) ⭐
  → Server generates unique token per session/form
  → Token embedded in form as hidden field
  → Server validates token on every POST request
  → Attacker can't guess the token! (random + encrypted)

  ② SAMESITE COOKIE ATTRIBUTE ⭐
  → Prevents browser from sending cookies on cross-site requests!
  → Attacks source problem directly

  ③ VERIFY REFERER / ORIGIN HEADER
  → Check where request came from
  → ⚠️ Not reliable alone (Referer can be spoofed!)

  ④ CAPTCHA
  → Ensures human interaction for sensitive operations
  → ⚠️ Bad UX if overused
```

```
CSRF TOKEN — HOW IT WORKS:
═══════════════════════════════════════════════════════════════

  ① Server generates random token (per session)
  ② Server sends token to client (in response body, NOT cookie!)
  ③ Client includes token in every request:
     → Hidden form field: <input type="hidden" name="_csrf" value="xyz">
     → OR custom header: X-CSRF-Token: xyz
  ④ Server validates: token in request matches session token?
     → YES: process request
     → NO: reject! (403 Forbidden)

  WHY IT WORKS:
  → Attacker on Evil.com CANNOT read the CSRF token!
     (Same-origin policy prevents reading target site's page)
  → Attacker can make browser SEND cookies (auto-attach)
     but CANNOT make browser SEND the token
     (token is in form/header, NOT in cookies!)
```

```
SAMESITE COOKIE — HOW IT WORKS:
═══════════════════════════════════════════════════════════════

  Set-Cookie: session=abc123; SameSite=Strict

  ┌──────────────┬──────────────────────────────────────────┐
  │ SameSite     │ Behavior                                 │
  ├──────────────┼──────────────────────────────────────────┤
  │ Strict       │ Cookie NEVER sent on cross-site requests │
  │              │ → Blocks ALL CSRF! ✅                    │
  │              │ → But breaks: clicking link to your site │
  │              │   from Google → not logged in! 😵        │
  │              │                                          │
  │ Lax          │ Cookie sent on safe methods (GET) only   │
  │ (default!)   │ → GET from cross-site: cookie sent ✅    │
  │              │ → POST from cross-site: cookie BLOCKED!  │
  │              │ → Best balance of security + UX ⭐       │
  │              │                                          │
  │ None         │ Cookie always sent (old behavior)        │
  │              │ → Must also set Secure flag!             │
  │              │ → Required for legitimate cross-site     │
  └──────────────┴──────────────────────────────────────────┘

  Lax (default since Chrome 80):
  → Safe: GET, HEAD, OPTIONS → cookie sent ✅
  → Unsafe: POST, PUT, DELETE → cookie BLOCKED! ❌
  → CSRF via POST is blocked automatically!
```

```
BEST PRACTICE — COMBINE DEFENSES:
═══════════════════════════════════════════════════════════════

  For maximum security, LAYER multiple defenses:

  ① SameSite=Lax cookies (blocks most CSRF automatically)
  +
  ② CSRF token for state-changing operations (POST/PUT/DELETE)
  +
  ③ Verify Origin/Referer header (supplementary check)
  +
  ④ CAPTCHA for high-risk operations (transfers, password changes)
```

---

## §9. Clickjacking

```
CLICKJACKING — ATTACK FLOW:
═══════════════════════════════════════════════════════════════

  ① Attacker creates attractive page (e.g., "Win a Prize!")
  ② Loads target site in INVISIBLE iframe on top of attractive page
  ③ Sets iframe to: opacity: 0 (100% transparent!)
  ④ Positions iframe so target's BUTTON aligns with attractive content
  ⑤ User clicks "Claim Prize" → actually clicks target site's button!
  ⑥ Target site's action executes (delete account, transfer, etc.)

  ┌──────────────────────────────────────────────────────┐
  │  What user SEES:                                     │
  │  ┌────────────────────────────────────────────────┐  │
  │  │  🎉 Congratulations! You won!                  │  │
  │  │                                                │  │
  │  │  ┌────────────────────┐                        │  │
  │  │  │  [ Claim Prize! ]  │ ← User clicks this    │  │
  │  │  └────────────────────┘                        │  │
  │  └────────────────────────────────────────────────┘  │
  │                                                      │
  │  What actually EXISTS (invisible):                    │
  │  ┌────────────────────────────────────────────────┐  │
  │  │  <iframe src="bank.com" opacity=0>             │  │
  │  │                                                │  │
  │  │  ┌─────────────────────┐                       │  │
  │  │  │ [ Transfer $10000 ] │ ← Actually clicked!   │  │
  │  │  └─────────────────────┘                       │  │
  │  └────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────┘
```

```css
/* How attacker styles the invisible iframe: */
.evil-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0; /* Completely invisible! */
  z-index: 9999; /* On top of everything! */
}
```

---

## §10. Clickjacking Defense

```
2 CLICKJACKING DEFENSE STRATEGIES:
═══════════════════════════════════════════════════════════════

  ① FRAME BUSTING (JavaScript)
  → Detect if page is in iframe → break out!

  ② X-FRAME-OPTIONS (HTTP Header) ⭐
  → Server tells browser: don't load me in iframe!
```

```javascript
// ① Frame Busting — JavaScript defense
if (top.location !== window.location) {
  top.location = window.location;
  // Forces the page out of any iframe!
}

// ⚠️ WEAKNESS:
// HTML5 <iframe sandbox> attribute can block JS execution inside iframe!
// IE <iframe security="restricted"> also blocks JS!
// → Frame busting can be DEFEATED by attacker!
// → That's why X-Frame-Options is preferred!
```

```
② X-FRAME-OPTIONS (HTTP Header) — PREFERRED!
═══════════════════════════════════════════════════════════════

  X-Frame-Options: DENY
  → Page CANNOT be displayed in ANY iframe. Period!

  X-Frame-Options: SAMEORIGIN
  → Page can only be in iframe from SAME origin domain

  X-Frame-Options: ALLOW-FROM https://example.com
  → Page can only be in iframe from specified domain

  SUPPORT: IE8+, Firefox 3.6+, Chrome 4+

  MODERN ALTERNATIVE — CSP frame-ancestors:
  Content-Security-Policy: frame-ancestors 'none'      (= DENY)
  Content-Security-Policy: frame-ancestors 'self'       (= SAMEORIGIN)
  Content-Security-Policy: frame-ancestors example.com  (= ALLOW-FROM)

  → CSP frame-ancestors is the modern replacement!
  → More flexible, better browser support
```

---

## §11. Security Scanning Tools

```
3 OPEN-SOURCE SECURITY SCANNERS:
═══════════════════════════════════════════════════════════════

  ① Arachni (Ruby)
  → Comprehensive vulnerability scanning framework
  → Detects: XSS, CSRF, SQL injection, file inclusion,
    command injection, path traversal
  → Plugins: form brute-force, HTTP brute-force, firewall detect
  → Supports: session persistence, browser clustering, snapshots

  ② Mozilla HTTP Observatory
  → Online tool: observatory.mozilla.org
  → Analyzes HTTP security headers
  → Scores: Cookie security, CORS, CSP, HSTS, HTTPS redirect,
    X-Frame-Options, X-XSS-Protection, Subresource Integrity
  → Easy: just enter URL → get letter grade!

  ③ w3af (Python)
  → Web application security scanner
  → Detects 200+ vulnerability types
  → XSS, SQL injection, OS command injection
  → Free and open-source
```

---

## §12. Summary & Interview Checklist

```
COMPLETE SECURITY MENTAL MODEL:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │ XSS (Cross-Site Scripting)                              │
  │  3 types: Reflected, DOM-based, Stored                  │
  │  Essence: malicious script executes in victim's browser │
  │  Defense: escape I/O, CSP, HttpOnly, input validation   │
  ├─────────────────────────────────────────────────────────┤
  │ CSRF (Cross-Site Request Forgery)                       │
  │  Essence: trick browser into sending authenticated req  │
  │  Defense: CSRF token, SameSite cookie, Referer check    │
  ├─────────────────────────────────────────────────────────┤
  │ Clickjacking                                            │
  │  Essence: transparent iframe tricks user into clicking   │
  │  Defense: X-Frame-Options, CSP frame-ancestors          │
  └─────────────────────────────────────────────────────────┘
```

### Checklist

- [ ] **XSS essence**: malicious code mixed with normal code → browser can't distinguish
- [ ] **Reflected XSS**: malicious URL → server reflects param in HTML → script executes
- [ ] **DOM-based XSS**: front-end JS inserts untrusted data via innerHTML/eval → client-side only
- [ ] **Stored XSS**: malicious code saved in DB → EVERY visitor affected → most dangerous!
- [ ] **XSS defense**: escape I/O, CSP headers, HttpOnly cookies, input length/type limits, CAPTCHA
- [ ] **CSP**: `Content-Security-Policy: default-src 'self'` — blocks inline/external scripts
- [ ] **Dangerous APIs**: innerHTML, outerHTML, document.write(), eval() → avoid with user input!
- [ ] **Safe APIs**: textContent, innerText, setAttribute() → use these instead!
- [ ] **XSS detection**: universal test string, `<img src=1 onerror=alert(1)>`, automated scanners
- [ ] **CSRF essence**: attacker's site sends request → victim's cookies auto-attached → impersonation!
- [ ] **CSRF ≠ stealing cookies**: CSRF USES cookies (browser attaches them), doesn't READ them
- [ ] **CSRF token**: server generates → embedded in form → validated on submit → attacker can't guess
- [ ] **SameSite=Lax**: default since Chrome 80, blocks POST cookies cross-site → most CSRF blocked!
- [ ] **SameSite=Strict**: blocks ALL cross-site cookies → breaks normal link navigation
- [ ] **Clickjacking**: transparent iframe over attractive page → user clicks hidden action
- [ ] **X-Frame-Options**: DENY / SAMEORIGIN / ALLOW-FROM → blocks iframe embedding
- [ ] **CSP frame-ancestors**: modern replacement for X-Frame-Options
- [ ] **Frame busting**: `if (top !== self) top.location = self.location` — can be defeated by sandbox!
- [ ] **Best practice**: layer defenses (CSP + Token + SameSite + X-Frame-Options)
- [ ] **Scanning tools**: Arachni, Mozilla Observatory, w3af, OWASP ZAP

---

_Nguồn: "Web Security: Essential Knowledge for Job Seekers" (43K reads)_
_Cập nhật lần cuối: Tháng 2, 2026_
