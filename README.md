# Pokemon-Hub
Pokemon website create by UTAR students

# Troubleshooting: API Data Loading & CORS Issues

## 📋 Issue Description
When running the **Pokemon Hub** project via VS Code's Live Server on different devices, the News and Home page content may fail to load (stuck on the "Loading..." spinner). 

In the browser console (F12), you might see errors like:
- `GET https://gnews.io/api/... 426 (Upgrade Required)`
- `Access to XMLHttpRequest at... has been blocked by CORS policy`
- The URL in the address bar starts with a local network IP (e.g., `http://192.168.x.x:5501` or `http://129.x.x.x:5501`) and shows a **"Not Secure"** warning.

## 🔍 Root Cause
Modern browsers (Chrome, Edge, etc.) and API providers have strict **Cross-Origin Resource Sharing (CORS)** and security policies. 
1. **Security Context**: Browsers treat local network IPs (like `192.168.x.x`) as "Unsafe Public Environments." Consequently, they block AJAX requests from these IPs to external APIs to protect user privacy.
2. **Localhost Privilege**: Requests made from `127.0.0.1` or `localhost` are considered "Development Environments" and are granted higher trust, allowing the API data to flow through.

## ✅ Solution: Configure Live Server IP
To ensure the project works on any device, you must force Live Server to use the **Loopback Address (127.0.0.1)** instead of the Local Network IP.

### Steps to Fix:
1. **Open Settings**: In VS Code, press `Ctrl + ,` (Windows/Linux) or `Cmd + ,` (Mac).
2. **Search for Setting**: Type `Live Server Setup` in the search bar.
3. **Locate IP Setting**: Find the option labeled:  
   `Live Server › Settings: Use Local Ip`
4. **Disable the Option**: **Uncheck** the box for this setting.
5. **Restart Server**: 
   - Click the **"Port: 5500"** (or 5501) button at the bottom right to stop the server.
   - Click **"Go Live"** again to restart it.

### Verification:
The browser should now automatically open with the address:  
`http://127.0.0.1:5501/pokemon_site/index.html`  
The API data should now load instantly.

---

## 🛡️ Robustness & Fallback Mechanism
This project is designed with **Defensive Programming** principles:
- **Fallback Data**: In the event of a total network failure or API rate-limiting, the system is programmed to automatically trigger a `fallbackArticles` array. This ensures that the UI remains populated with high-quality content even in an offline or restricted environment.
- **Environment Awareness**: The code utilizes standard RESTful API integration while maintaining a local data buffer for maximum reliability during presentations.
