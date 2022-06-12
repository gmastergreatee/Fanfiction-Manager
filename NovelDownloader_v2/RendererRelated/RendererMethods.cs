using CefSharp;
using CefSharp.WinForms;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.RendererRelated
{
    public class RendererMethods : IRendererMethods
    {
        const string initCss = "html,body{height:100%;width:100%;margin:0}div{height:100%;display:flex;flex-flow:column;justify-content:center;align-items:center;font-size:26}";
        public string InitHtml { get; protected set; } = "<html><body><style>" + initCss + "</style><div><span>Hi Renderer!!</span><span>!~~Please wait while we load ur stuff~~!</span></div></body></html>";

        public ChromiumWebBrowser Browser
        {
            get
            {
                return _Browser;
            }
        }
        private ChromiumWebBrowser _Browser { get; set; } = new ChromiumWebBrowser();

        public IRendererJavascriptExecutor JavascriptExecutor
        {
            get
            {
                return _JavascriptExecutor;
            }
        }
        private IRendererJavascriptExecutor _JavascriptExecutor { get; set; }

        public IRendererLocalStorage LocalStorage
        {
            get
            {
                return _LocalStorage;
            }
        }
        private IRendererLocalStorage _LocalStorage { get; set; }

        public IRendererURLBlocker URLBlocker
        {
            get
            {
                return _URLBlocker;
            }
        }
        private IRendererURLBlocker _URLBlocker { get; set; }

        public RendererMethods(bool isTestMode = false)
        {
            _JavascriptExecutor = new RendererJavascriptExecutor(_Browser);
            _LocalStorage = new RendererLocalStorage(_Browser, _JavascriptExecutor);
            _URLBlocker = new RendererURLBlocker(_Browser, isTestMode);
        }

        public void ResetPage()
        {
            _Browser.LoadHtml(InitHtml);
        }

        public void ResetCookies(string resetCookiesUrl = "")
        {
            if (!string.IsNullOrWhiteSpace(resetCookiesUrl))
            {
                Cef.GetGlobalCookieManager().DeleteCookies(resetCookiesUrl);
            }
            else
            {
                Cef.GetGlobalCookieManager().DeleteCookies();
            }
        }
    }
}
