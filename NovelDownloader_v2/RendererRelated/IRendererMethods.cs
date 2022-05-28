using CefSharp.WinForms;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.RendererRelated
{
    public interface IRendererMethods
    {
        ChromiumWebBrowser Browser { get; }
        IRendererJavascriptExecutor JavascriptExecutor { get; }
        IRendererLocalStorage LocalStorage { get; }
        IRendererURLBlocker URLBlocker { get; }
        void ResetPage();
        void ResetCookies(string resetCookiesUrl = "");
        void ShutDown();
    }
}
