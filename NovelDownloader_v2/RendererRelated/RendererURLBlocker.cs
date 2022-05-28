using CefSharp.WinForms;
using System.Collections.Generic;

namespace NovelDownloader_v2.RendererRelated
{
    public class RendererURLBlocker : IRendererURLBlocker
    {
        private ChromiumWebBrowser browser { get; set; }

        public RendererURLBlocker(ChromiumWebBrowser browser)
        {
            this.browser = browser;
        }

        public void BlockURLs(List<string> urlsToBlock)
        {
            browser.RequestHandler = new RendererRequestHandler(urlsToBlock, false);
        }

        public void ClearBlockList()
        {
            browser.RequestHandler = new RendererRequestHandler(null, false);
        }
    }
}
