// Visual smoke check para EventSystem AVPAML7B.
// Loguea por API, inyecta el JWT en localStorage (es_jwt/es_refresh/es_refresh_exp,
// las mismas claves que usa JwtAuthStateProvider) y captura screenshots full-page
// de las rutas indicadas. Pensado para que un agente IA (o el operador) detecte
// regresiones esteticas obvias sin abrir el navegador manualmente.
//
// Uso tipico (via wrapper):
//   scripts\visual-check.ps1 /qr-studio /socios
// Directo:
//   dotnet run --project scripts\visual-check -- --routes /qr-studio,/socios

using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Playwright;

var baseUrl  = Environment.GetEnvironmentVariable("VC_BASE_URL")  ?? "https://localhost:7021";
var email    = Environment.GetEnvironmentVariable("VC_EMAIL")     ?? "yagogurru77@gmail.com";
var password = Environment.GetEnvironmentVariable("VC_PASSWORD")
    ?? throw new InvalidOperationException("Falta la variable de entorno VC_PASSWORD (no hay contrasena por defecto).");
var outDir   = Environment.GetEnvironmentVariable("VC_OUT")       ?? DefaultOutDir();
var viewport = Environment.GetEnvironmentVariable("VC_VIEWPORT")  ?? "1440x900";
var hydrateMs = int.TryParse(Environment.GetEnvironmentVariable("VC_HYDRATE_MS"), out var h) ? h : 1500;
// Para apps publicas (sin login): saltamos el POST /api/auth/login y no inyectamos
// JWT en localStorage. Util para Next.js/React/Vue/Blazor publico, etc.
var noLogin  = Environment.GetEnvironmentVariable("VC_NO_LOGIN") is "1" or "true";
var routes   = new List<string>();

for (int i = 0; i < args.Length; i++)
{
    var a = args[i];
    string Next() => ++i < args.Length ? args[i] : throw new ArgumentException($"Falta valor para {a}");
    switch (a)
    {
        case "--base-url":  baseUrl  = Next(); break;
        case "--email":     email    = Next(); break;
        case "--password":  password = Next(); break;
        case "--out":       outDir   = Next(); break;
        case "--viewport":  viewport = Next(); break;
        case "--hydrate-ms": hydrateMs = int.Parse(Next()); break;
        case "--no-login":  noLogin  = true; break;
        case "--routes":
            routes.AddRange(Next().Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
            break;
        default:
            if (a.StartsWith("--")) throw new ArgumentException($"Argumento desconocido: {a}");
            routes.Add(a);
            break;
    }
}

if (routes.Count == 0)
{
    // Set por defecto: rutas que cubren cada modulo principal. Si toca una pagina
    // concreta el invocador deberia pasarla explicita en vez de fotografiar todo.
    routes = new() { "/", "/qr-studio", "/avisos", "/socios", "/eventos", "/cuotas", "/donativos" };
}

var (vw, vh) = ParseViewport(viewport);
Directory.CreateDirectory(outDir);
Console.WriteLine($"[visual-check] base={baseUrl}  viewport={vw}x{vh}  hydrate={hydrateMs}ms  login={(noLogin ? "no" : "yes")}");
if (!noLogin) Console.WriteLine($"[visual-check] user={email}");
Console.WriteLine($"[visual-check] rutas ({routes.Count}): {string.Join(", ", routes)}");
Console.WriteLine($"[visual-check] out: {outDir}");

LoginResult? login = null;

if (!noLogin)
{
    // 1) Login por API (mas barato y robusto que automatizar el formulario).
    using var handler = new HttpClientHandler { ServerCertificateCustomValidationCallback = (_, _, _, _) => true };
    using var http = new HttpClient(handler) { BaseAddress = new Uri(baseUrl), Timeout = TimeSpan.FromSeconds(15) };
    HttpResponseMessage loginResp;
    try
    {
        loginResp = await http.PostAsJsonAsync("/api/auth/login", new { Email = email, Password = password });
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"[visual-check] No se pudo contactar al server en {baseUrl}: {ex.Message}");
        Console.Error.WriteLine("[visual-check] Revisa que el server este arriba o usa el wrapper PowerShell que lo arranca por ti.");
        return 2;
    }

    if (!loginResp.IsSuccessStatusCode)
    {
        var body = await loginResp.Content.ReadAsStringAsync();
        Console.Error.WriteLine($"[visual-check] Login HTTP {(int)loginResp.StatusCode}: {body}");
        return 3;
    }

    login = await loginResp.Content.ReadFromJsonAsync<LoginResult>();
    if (login is null || !login.Exito || string.IsNullOrEmpty(login.Token))
    {
        Console.Error.WriteLine($"[visual-check] Login fallido: {login?.Error ?? "respuesta vacia"}");
        return 3;
    }

    var roles = login.Usuario?.Roles is { Count: > 0 } r ? string.Join(",", r) : "(sin roles)";
    Console.WriteLine($"[visual-check] login OK: {login.Usuario?.NombreCompleto ?? email} [{roles}]");
}

// 2) Playwright.
using var pw = await Playwright.CreateAsync();
await using var browser = await pw.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = true });
await using var ctx = await browser.NewContextAsync(new BrowserNewContextOptions
{
    ViewportSize = new ViewportSize { Width = vw, Height = vh },
    IgnoreHTTPSErrors = true,
    Locale = "es-ES",
    TimezoneId = "Europe/Madrid"
});

if (login is not null)
{
    // Sembrar localStorage ANTES de cualquier navegacion: JwtAuthStateProvider lo lee
    // al arrancar (GetAuthenticationStateAsync) y el AuthRefreshHandler espera el
    // header Authorization. Sin esto el WASM nos redirige a /login.
    var refreshExp = (login.RefreshTokenExpiresAt ?? DateTime.UtcNow.AddDays(14)).ToString("o");
    var initScript = $@"
        try {{
            localStorage.setItem('es_jwt', {Json(login.Token!)});
            localStorage.setItem('es_refresh', {Json(login.RefreshToken ?? "")});
            localStorage.setItem('es_refresh_exp', {Json(refreshExp)});
        }} catch (e) {{ console.error('init-script localStorage:', e); }}
    ";
    await ctx.AddInitScriptAsync(initScript);
}

var page = await ctx.NewPageAsync();
page.Console += (_, msg) =>
{
    if (msg.Type is "error" or "warning")
        Console.WriteLine($"  [browser:{msg.Type}] {msg.Text}");
};
page.PageError += (_, err) => Console.WriteLine($"  [browser:pageerror] {err}");

var captured = new List<string>();
var failed = new List<string>();
foreach (var route in routes)
{
    var url = baseUrl.TrimEnd('/') + (route.StartsWith('/') ? route : "/" + route);
    Console.Write($"[visual-check] {route} ... ");
    try
    {
        await page.GotoAsync(url, new PageGotoOptions { WaitUntil = WaitUntilState.NetworkIdle, Timeout = 30_000 });
        // Margen extra de hidratacion: aunque NetworkIdle ya implica 500 ms sin red,
        // Blazor WASM puede seguir pintando despues. Configurable via VC_HYDRATE_MS.
        await page.WaitForTimeoutAsync(hydrateMs);

        // Scroll completo antes de capturar — necesario para framer-motion `whileInView`
        // y cualquier IntersectionObserver. Sin esto las secciones por debajo del viewport
        // inicial quedan en opacity:0 y la full-page screenshot las captura invisibles.
        await page.EvaluateAsync(@"async () => {
            const total = document.body.scrollHeight;
            const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
            for (let y = 0; y < total; y += step) {
                window.scrollTo(0, y);
                await new Promise(r => setTimeout(r, 90));
            }
            window.scrollTo(0, total);
            await new Promise(r => setTimeout(r, 150));
            window.scrollTo(0, 0);
            await new Promise(r => setTimeout(r, 250));
        }");

        var fileName = SafeFileName(route) + ".png";
        var path = Path.Combine(outDir, fileName);
        await page.ScreenshotAsync(new PageScreenshotOptions { Path = path, FullPage = true });
        captured.Add(path);
        Console.WriteLine($"OK -> {fileName}");
    }
    catch (Exception ex)
    {
        failed.Add($"{route}: {ex.Message}");
        Console.WriteLine($"FAIL ({ex.GetType().Name}: {ex.Message})");
    }
}

Console.WriteLine();
Console.WriteLine($"[visual-check] capturadas {captured.Count}/{routes.Count}");
Console.WriteLine($"[visual-check] carpeta: {outDir}");
foreach (var c in captured) Console.WriteLine($"  - {c}");
if (failed.Count > 0)
{
    Console.WriteLine($"[visual-check] fallos:");
    foreach (var f in failed) Console.WriteLine($"  - {f}");
}

return failed.Count == 0 ? 0 : 1;

static string DefaultOutDir()
{
    // scripts/visual-check/bin/Debug/net8.0 -> subir 4 -> scripts -> screenshots/<ts>
    var bin = AppContext.BaseDirectory;
    var scripts = Path.GetFullPath(Path.Combine(bin, "..", "..", "..", ".."));
    return Path.Combine(scripts, "screenshots", DateTime.Now.ToString("yyyyMMdd-HHmmss"));
}

static (int w, int h) ParseViewport(string s)
{
    var parts = s.Split('x', 2);
    if (parts.Length != 2 || !int.TryParse(parts[0], out var w) || !int.TryParse(parts[1], out var h))
        throw new ArgumentException($"Viewport invalido: '{s}'. Formato WxH (ej. 1440x900).");
    return (w, h);
}

static string SafeFileName(string route)
{
    var t = route.Trim('/').Replace('/', '_').Replace('?', '_').Replace('&', '_').Replace('=', '_');
    foreach (var c in Path.GetInvalidFileNameChars()) t = t.Replace(c, '_');
    return string.IsNullOrEmpty(t) ? "home" : t;
}

static string Json(string s) => JsonSerializer.Serialize(s);

record LoginResult(
    bool Exito,
    string? Token,
    DateTime? Expira,
    UserInfo? Usuario,
    string? Error,
    string? RefreshToken,
    DateTime? RefreshTokenExpiresAt);

record UserInfo(string Id, string Email, string NombreCompleto, List<string> Roles);
