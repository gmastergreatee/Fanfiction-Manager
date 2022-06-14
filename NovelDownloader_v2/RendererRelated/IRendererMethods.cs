using CefSharp.WinForms;

namespace NovelDownloader_v2.RendererRelated
{
    public interface IRendererMethods
    {
        ChromiumWebBrowser Browser { get; }
        IRendererJavascriptExecutor JavascriptExecutor { get; }
        IRendererLocalStorage LocalStorage { get; }
        IRendererURLBlocker URLBlocker { get; }
        void ResetPage();
        void LoadURL(string url);
        void ResetCookies(string resetCookiesUrl = "");
    }
}
