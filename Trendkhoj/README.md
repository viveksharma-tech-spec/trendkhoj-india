# 🇮🇳 TrendKhoj India

> **"Aaj India Mein Kya Trending Hai?"** — An India-focused trending topics discovery platform inspired by the clarity of Google Trends Trending Now, featuring original SaaS branding, responsive design, editorial outline tools, and flexible CSV/RSS data import capabilities.

---

## 🌟 Key Highlights

- **100% Vanilla Tech Stack:** Built with pure HTML5, modern CSS3, and vanilla JavaScript. Zero paid APIs, zero npm packages, and zero build steps required.
- **Netlify Ready:** Pre-configured with `netlify.toml`, `_redirects`, `sitemap.xml`, and `robots.txt` for instant static hosting.
- **Original SaaS Design:** Custom blue primary (`#2563EB`), crisp slate background (`#F8FAFC`), dark navy typography (`#0F172A`), rounded cards with subtle shadows, and a tricolor discovery emblem.
- **Dual View Layout:** Seamlessly switch between a full desktop data table and mobile-first card grids.
- **Bilingual Topic Explorer:** Instant editable article outlines in English, Hindi (हिंदी), and Hinglish, plus headline & social caption generators created entirely using local algorithmic templates (zero AI API tokens needed).
- **Data Authenticity Guarantee:** Clearly distinguishes between demo data and imported datasets. Never fakes search volume, timestamps, or rankings.
- **Client-Side Privacy:** Favorites, search history, custom CSVs, and outline notes are stored privately on your device in `localStorage`.

---

## 📁 Project Structure

```text
Trendkhoj/
├── index.html                   # Main application dashboard & topic explorer (double-click to open)
├── style.css                    # Complete CSS stylesheet for all pages & layouts
├── script.js                    # Complete consolidated JavaScript application bundle
├── README.md                    # Project documentation & deployment guide
├── cricket-category.jpg         # Professional Indian cricket stadium image
├── education-category.jpg       # Indian university students studying image
├── favicon.svg                  # Brand SVG emblem and icon
├── about.html                   # Mission, methodology & Google Trends attribution
├── privacy.html                 # Privacy policy & localStorage transparency
├── contact.html                 # Contact form with email mailto generator & FAQs
├── sample-trends.csv            # Ready-to-use sample dataset for testing CSV import
├── sitemap.xml                  # SEO search engine sitemap
├── robots.txt                   # Crawler directives
├── _redirects                   # Netlify fallback routing
├── netlify.toml                 # Netlify security headers and cache rules
└── assets/                      # Full asset directory containing all original images and styles
    ├── css/
    ├── js/
    └── images/
```

---

## 🚀 How to Preview the Website Locally

You can preview TrendKhoj India on your computer immediately without installing Node.js or any build tools!

### Method 1: Direct Browser Opening (Easiest)
1. Open File Explorer and navigate to the project directory:
   `C:\Users\VIVEK SHARMA\.gemini\antigravity\scratch\trendkhoj-india\`
2. Double-click **`index.html`** (or right-click -> **Open with** -> Google Chrome, Edge, or Firefox).
3. The full dashboard will load and run immediately.

### Method 2: Local HTTP Server via PowerShell (Recommended for RSS Testing)
Some browser security policies restrict reading local XML files via `file://`. Running a lightweight local HTTP server solves this:

1. Open PowerShell and navigate to the folder:
   ```powershell
   cd "C:\Users\VIVEK SHARMA\.gemini\antigravity\scratch\trendkhoj-india"
   ```
2. Start PowerShell's built-in .NET web server script:
   ```powershell
   powershell -ExecutionPolicy Bypass -Command "$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8080/'); $listener.Start(); Write-Host 'Server running at http://localhost:8080/ (Press Ctrl+C to stop)'; while($listener.IsListening){ $context = $listener.GetContext(); $path = Join-Path (Get-Location) $context.Request.Url.LocalPath.TrimStart('/'); if([string]::IsNullOrEmpty($context.Request.Url.LocalPath.Trim('/'))){ $path = Join-Path (Get-Location) 'index.html' }; if(Test-Path $path -PathType Leaf){ $bytes = [System.IO.File]::ReadAllBytes($path); $context.Response.ContentLength64 = $bytes.Length; $context.Response.OutputStream.Write($bytes, 0, $bytes.Length) } else { $context.Response.StatusCode = 404 }; $context.Response.OutputStream.Close() }"
   ```
3. Open your browser and visit: **`http://localhost:8080`**

### Method 3: VS Code Live Server
1. Open the `trendkhoj-india` folder in Visual Studio Code.
2. Install the **Live Server** extension by Ritwick Dey.
3. Click **"Go Live"** in the bottom status bar.

---

## ☁️ How to Deploy on Netlify (Step-by-Step)

Deploying TrendKhoj India to Netlify is 100% free and takes less than 60 seconds.

### Method A: Netlify Drop (No Git Required)
1. Open your browser and go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Sign in or create a free Netlify account.
3. Open your file manager and locate the `trendkhoj-india` folder:
   `C:\Users\VIVEK SHARMA\.gemini\antigravity\scratch\trendkhoj-india`
4. **Drag and drop the entire `trendkhoj-india` folder** into the upload area on Netlify.
5. Netlify will upload the files and provide an instant live URL (e.g. `https://peaceful-sunset-xxxx.netlify.app`).
6. You can rename the site to `trendkhoj-india.netlify.app` under **Site configuration > Change site name**.

### Method B: Deploy via GitHub (For Continuous Deployment)
1. Initialize a Git repository and commit the files:
   ```bash
   git init
   git add .
   git commit -m "Initial release of TrendKhoj India"
   ```
2. Push the repository to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/trendkhoj-india.git
   git branch -M main
   git push -u origin main
   ```
3. On Netlify, click **"Add new site" > "Import an existing project"**.
4. Select GitHub and choose your `trendkhoj-india` repository.
5. Keep Build Command **empty** and Publish Directory as `.` (current root directory).
6. Click **"Deploy site"**. Every future `git push` will deploy automatically!

---

## 🛠 Features Walkthrough

### 1. Categories & Time Filters
- Filter through 7 India-specific categories: **Cricket**, **Education**, **Jobs**, **Technology**, **Entertainment**, **Automobile**, and **Government**.
- Narrow topics by publication/event window: **4 Hours**, **24 Hours**, **48 Hours**, **7 Days**, or **All Time**.

### 2. Search & Search History
- Search by keywords, categories, summaries, or related tags.
- Search queries are saved locally to a recent searches bar with instant 1-click removal or "Clear all".

### 3. Topic Explorer & Content Suite
Click on any topic title or the **"Analyze ✍️"** button to open the Topic Explorer:
- **Article Outline:** Switch between **English**, **Hindi (हिंदी)**, and **Hinglish**. Edit the text directly in the browser and click **Save Notes** to store your draft in `localStorage`.
- **Headlines & Social Copy:** Ready-to-copy Twitter/X threads, WhatsApp bulletins, LinkedIn post starters, and Instagram captions with tailored hashtags.
- **Official Links:** One-click links to Google Trends Explore India, Google News India, and the primary government or institutional source portal.

### 4. Custom CSV Import with Column Mapping
1. Click **"Import CSV"** in the top navigation or footer.
2. Select or drag any `.csv` file (or test with the provided `sample-trends.csv`).
3. Use the visual column mapper to map your file's columns to:
   - *Topic Title* (Required)
   - *Category*, *Search Volume*, *Source*, *URL*, *Date*, *Status* (Optional)
4. Click **"Validate & Import"**. The platform validates rows and immediately displays your custom dataset.

### 5. Safe RSS / Atom Import
- **URL Fetching:** Enter an RSS URL (such as Google Trends RSS `https://trends.google.com/trending/rss?geo=IN`) and fetch it using a public CORS proxy.
- **Safe Manual XML Paste:** If browser network policies or proxy firewalls block the URL, simply open the feed in a new tab, copy the raw XML text, and paste it into the **Safe Manual XML Paste** tab. The browser parses it natively via `DOMParser` with 100% reliability.

### 6. CSV Export & Sharing
- Export your currently filtered list at any time to a clean `.csv` file.
- Share individual topics via WhatsApp or mobile Web Share with pre-formatted summaries.

---

## ⚖️ Editorial Disclaimer & Attribution

- **Search Interest ≠ Truth:** TrendKhoj India tracks search curiosities and query momentum. High search interest is **not proof** that a claim, rumor, viral forward, or news story is true. Writers and researchers must always corroborate claims with verified official sources.
- **Attribution:** Google Trends™ is a trademark of Google LLC. TrendKhoj India is an independent platform and is not affiliated with Google. Direct links to official Google Trends pages are provided for live real-time analysis.

---

## 📄 License

MIT License. Designed and engineered for the community.
