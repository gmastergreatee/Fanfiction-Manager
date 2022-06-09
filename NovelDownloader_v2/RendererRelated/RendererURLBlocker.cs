using CefSharp;
using CefSharp.WinForms;
using System;
using System.Collections.Generic;

namespace NovelDownloader_v2.RendererRelated
{
    public class RendererURLBlocker : IRendererURLBlocker
    {
        private ChromiumWebBrowser Browser { get; set; }
        private bool IsTestMode { get; set; }

        public RendererURLBlocker(ChromiumWebBrowser browser, bool isTestMode = false)
        {
            Browser = browser;
            IsTestMode = isTestMode;
        }

        public void BlockURLs(List<string> urlsToBlock)
        {
            Browser.RequestHandler = new RendererRequestHandler(urlsToBlock, false, IsTestMode);
        }

        public void ClearBlockList()
        {
            Browser.RequestHandler = new RendererRequestHandler(null, false, IsTestMode);
        }
    }
}
